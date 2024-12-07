import { useStorage } from '@hooks/useStore';
import ColorPalette from '@icons/ColorPalette.svg';

const themes = [
  { name: 'light', displayName: 'Light' },
  { name: 'dim', displayName: 'Dim' },
  { name: 'dark', displayName: 'Dark' },
];
export function Settings() {
  const [settings, setSettings] = useStorage('settings');

  const onThemeChange = (event: React.FormEvent<HTMLInputElement>) => {
    setSettings({ ...settings, theme: event.currentTarget.value as 'dark' });
  };

  return (
    <div>
      <h2 className="text-xl text-primary flex items-center justify-center w-fit mb-1">
        <ColorPalette />
        Apperance settings
      </h2>
      <ul className="flex gap-3 items-start">
        {themes.map((t) => (
          <li key={t.name} data-theme={t.name}>
            <ApperanceItem
              checked={settings.theme === t.name}
              displayName={t.displayName}
              name={t.name}
              onChange={onThemeChange}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

type ApperanceItemProps = {
  onChange: (e: React.FormEvent<HTMLInputElement>) => void;
  checked: boolean;
  name: string;
  displayName: string;
};

export function ApperanceItem({ onChange, checked, name, displayName }: ApperanceItemProps) {
  return (
    <label className="h-16 w-24 border border-primary rounded-sm bg-primary text-primary flex justify-center items-center min-w-10">
      <input checked={checked} id={name} name={name} type="checkbox" value={name} onChange={onChange} />
      <span className="ml-1">{displayName}</span>
    </label>
  );
}
