import type { ImageLike, OEM, WorkerOptions } from 'tesseract.js';
import { imageToText } from '../image';

const { worker, createWorker } = vi.hoisted(() => {
  const ocrWorker = {
    recognize: vi.fn<(image: ImageLike) => Promise<{ data: { text: string } }>>(),
    terminate: vi.fn<() => Promise<void>>(),
  };
  return {
    worker: ocrWorker,
    createWorker: vi.fn<(language: string, oem: OEM, options: Partial<WorkerOptions>) => Promise<typeof ocrWorker>>(),
  };
});

vi.mock('tesseract.js', () => ({ default: { createWorker, OEM: { LSTM_ONLY: 1 } } }));

beforeEach(() => {
  createWorker.mockReset().mockResolvedValue(worker);
  worker.recognize.mockReset().mockResolvedValue({ data: { text: 'Recognized note' } });
  worker.terminate.mockReset().mockResolvedValue(undefined);
  vi.stubGlobal('chrome', {
    runtime: { getURL: (file: string) => `chrome-extension://note-it/${file}` },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it.each([undefined, 'fra'])('recognizes an image with language %s and releases its worker', async (language) => {
  const image = new Blob(['image'], { type: 'image/png' });

  const text = await imageToText(image, language);

  expect(text).toBe('Recognized note');
  expect(createWorker).toHaveBeenCalledWith(language ?? 'eng', 1, {
    workerBlobURL: false,
    workerPath: 'chrome-extension://note-it/libraries/worker.min.js',
    corePath: 'chrome-extension://note-it/libraries',
    errorHandler: expect.any(Function),
  });
  expect(worker.recognize).toHaveBeenCalledExactlyOnceWith(image);
  expect(worker.terminate).toHaveBeenCalledOnce();
});

it('releases its worker when recognition fails', async () => {
  const error = new Error('Invalid image');
  worker.recognize.mockRejectedValueOnce(error);
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});

  const text = await imageToText(new Blob());

  expect(text).toBeUndefined();
  expect(worker.terminate).toHaveBeenCalledOnce();
  expect(log).toHaveBeenCalledWith('Error converting image to text', error);
});

it('returns when initialization reports an error without settling the creation promise', async () => {
  const error = new Error('Language data unavailable');
  createWorker.mockImplementationOnce((_language, _oem, options) => {
    options.errorHandler?.(error);
    return new Promise(() => {});
  });
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});

  const text = await imageToText(new Blob());

  expect(text).toBeUndefined();
  expect(worker.recognize).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith('Error converting image to text', error);
});
