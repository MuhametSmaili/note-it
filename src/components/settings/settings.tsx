import { useStorage } from '@hooks/useStore';

export function Settings() {
  const [settings, setSettings] = useStorage('settings');

  const onThemeChange = (event: React.FormEvent<HTMLInputElement>) => {
    setSettings({ ...settings, theme: event.currentTarget.value as 'dark' });
  };

  return (
    <div>
      <div>
        <h3>Apperance settings</h3>
        <ul>
          <li>
            <label>
              <input
                checked={settings.theme === 'light'}
                type="checkbox"
                value="light"
                id="light"
                onClick={onThemeChange}
              />
              Light
            </label>
          </li>
          <li>
            <label>
              <input checked={settings.theme === 'dim'} id="dim" type="checkbox" value="dim" onChange={onThemeChange} />
              Dim
            </label>
          </li>
          <li>
            <label>
              <input
                checked={settings.theme === 'dark'}
                id="dark"
                name="dark"
                type="checkbox"
                value="dark"
                onChange={onThemeChange}
              />
              Dark
            </label>
          </li>
        </ul>
      </div>
    </div>
  );
}
