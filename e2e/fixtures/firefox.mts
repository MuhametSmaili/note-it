import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

export const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object.');
  return Object.fromEntries(Object.entries(value));
};

export async function launchFirefoxExtension() {
  const profile = await mkdtemp(path.join(tmpdir(), 'note-it-firefox-'));
  const downloads = path.join(profile, 'downloads');
  await mkdir(downloads);
  const manifest = record(JSON.parse(await readFile('build/firefox/manifest.json', 'utf8')));
  const id = record(record(manifest.browser_specific_settings).gecko).id;
  if (typeof id !== 'string') throw new Error('Missing Firefox add-on ID.');
  const uuid = crypto.randomUUID();
  const preferences = {
    'extensions.webextensions.uuids': JSON.stringify({ [id]: uuid }),
    'browser.download.dir': downloads,
    'browser.download.folderList': 2,
    'browser.download.useDownloadDir': true,
    'browser.helperApps.neverAsk.saveToDisk': 'application/pdf,image/png',
    'pdfjs.disabled': true,
    'browser.shell.checkDefaultBrowser': false,
    'browser.startup.homepage_override.mstone': 'ignore',
    'browser.startup.page': 0,
    'browser.startup.homepage': 'about:blank',
    'browser.newtabpage.enabled': false,
    'startup.homepage_welcome_url': 'about:blank',
    'startup.homepage_welcome_url.additional': '',
    'datareporting.policy.dataSubmissionPolicyBypassNotification': true,
  };
  await writeFile(
    path.join(profile, 'user.js'),
    Object.entries(preferences)
      .map(([key, value]) => `user_pref(${JSON.stringify(key)}, ${JSON.stringify(value)});`)
      .join('\n'),
  );

  const child = spawn(
    process.env.FIREFOX_BIN ??
      (process.platform === 'darwin' ? '/Applications/Firefox.app/Contents/MacOS/firefox' : 'firefox'),
    ['--headless', '--no-remote', '--profile', profile, '--remote-debugging-port', '0', '--remote-allow-system-access'],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, MOZ_REMOTE_ALLOW_SYSTEM_ACCESS: '1' },
    },
  );
  const stopped = new Promise<void>((resolve) => {
    child.once('exit', () => resolve());
    child.once('error', () => resolve());
  });
  const endpoint = Promise.withResolvers<string>();
  let output = '';
  const timeout = setTimeout(
    () => endpoint.reject(new Error(`Firefox did not expose its BiDi endpoint: ${output}`)),
    20_000,
  );
  const captureOutput = (chunk: Buffer) => {
    output += chunk.toString();
    const url = output.match(/WebDriver BiDi listening on (ws:\/\/[^\s]+)/)?.[1];
    if (url) endpoint.resolve(`${url}/session`);
  };
  child.stderr.on('data', captureOutput);
  child.stdout.on('data', captureOutput);
  child.on('error', (error) => endpoint.reject(error));
  child.on('exit', (code, signal) =>
    endpoint.reject(new Error(`Firefox stopped during startup (${code ?? signal}): ${output}`)),
  );
  let socket: WebSocket | undefined;
  const close = async () => {
    clearTimeout(timeout);
    socket?.close();
    child.kill();
    await stopped;
    await rm(profile, { recursive: true, force: true });
  };

  try {
    socket = new WebSocket(await endpoint.promise);
    clearTimeout(timeout);
    await once(socket, 'open');
    const connected = socket;
    let nextId = 0;
    const pending = new Map<number, ReturnType<typeof Promise.withResolvers<Record<string, unknown>>>>();
    const events = new Map<string, (params: Record<string, unknown>) => Promise<void>>();
    const failures: Error[] = [];
    const command = async (method: string, params: object = {}) => {
      const requestId = ++nextId;
      const result = Promise.withResolvers<Record<string, unknown>>();
      pending.set(requestId, result);
      const deadline = setTimeout(
        () => result.reject(new Error(`Firefox command timed out: ${method}\n${output}`)),
        20_000,
      );
      connected.send(JSON.stringify({ id: requestId, method, params }));
      try {
        return await result.promise;
      } finally {
        clearTimeout(deadline);
        pending.delete(requestId);
      }
    };
    connected.addEventListener('message', (event: MessageEvent<unknown>) => {
      if (typeof event.data !== 'string') return;
      const message = record(JSON.parse(event.data));
      if (typeof message.id === 'number') {
        const waiting = pending.get(message.id);
        if (message.type === 'error') waiting?.reject(new Error(String(message.message)));
        else waiting?.resolve(record(message.result));
      } else if (typeof message.method === 'string') {
        events
          .get(message.method)?.(record(message.params))
          .catch((error: unknown) => {
            failures.push(error instanceof Error ? error : new Error(String(error)));
          });
      }
    });
    connected.addEventListener('close', () => {
      pending.forEach((entry) => entry.reject(new Error('Firefox connection closed.')));
    });
    const session = await command('session.new', { capabilities: { alwaysMatch: {} } });
    await command('webExtension.install', {
      extensionData: { type: 'path', path: path.resolve('build/firefox') },
    });
    const navigate = (context: string, url: string) =>
      command('browsingContext.navigate', { context, url, wait: 'complete' });
    const page = async (url: string) => {
      const result = await command('browsingContext.create', { type: 'tab' });
      if (typeof result.context !== 'string') throw new Error('Missing Firefox browsing context.');
      await navigate(result.context, url);
      return result.context;
    };
    const evaluate = async (context: string, expression: string): Promise<unknown> => {
      const result = await command('script.evaluate', {
        expression: `(async () => { ${expression} })().then(value => JSON.stringify(value))`,
        target: { context },
        awaitPromise: true,
      });
      if (result.type !== 'success') throw new Error(JSON.stringify(result.exceptionDetails));
      const value = record(result.result);
      return typeof value.value === 'string' ? JSON.parse(value.value) : undefined;
    };
    const interceptLanguage = async (bytes: Buffer) => {
      events.set('network.beforeRequestSent', async (event) => {
        if (!event.isBlocked) return;
        await command('network.provideResponse', {
          request: record(event.request).request,
          statusCode: 200,
          headers: [
            { name: 'content-type', value: { type: 'string', value: 'application/gzip' } },
            { name: 'access-control-allow-origin', value: { type: 'string', value: '*' } },
          ],
          body: { type: 'base64', value: bytes.toString('base64') },
        });
      });
      await command('session.subscribe', { events: ['network.beforeRequestSent'] });
      await command('network.addIntercept', {
        phases: ['beforeRequestSent'],
        urlPatterns: [{ type: 'pattern', protocol: 'https', hostname: 'cdn.jsdelivr.net' }],
      });
    };
    return {
      origin: `moz-extension://${uuid}`,
      version: record(session.capabilities).browserVersion,
      downloads,
      failures,
      command,
      page,
      navigate,
      evaluate,
      interceptLanguage,
      close,
    };
  } catch (error) {
    await close();
    throw error;
  }
}
