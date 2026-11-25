import { useStorage } from "@hooks/use-storage.hook";
import ColorPalette from "@icons/color-palette.svg";

const themes = [
  { name: "light", displayName: "Light" },
  { name: "dim", displayName: "Dim" },
  { name: "dark", displayName: "Dark" },
];
export function Settings() {
  const [settings, setSettings] = useStorage("settings");

  const onThemeChange = (event: React.FormEvent<HTMLInputElement>) => {
    const theme = event.currentTarget.value;
    if (theme !== "light" && theme !== "dim" && theme !== "dark") return;
    setSettings({ ...settings, theme }).catch((error: unknown) => console.error("Cannot save theme:", error));
  };

  return (
    <div>
      <h2 className="mb-1 flex w-fit items-center justify-center text-xl text-primary">
        <ColorPalette />
        Apperance settings
      </h2>
      <ul className="flex flex-wrap items-start gap-3">
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
    <label className="flex h-16 w-24 min-w-10 items-center justify-center rounded-sm border border-primary bg-primary text-primary">
      <input checked={checked} id={name} name={name} type="checkbox" value={name} onChange={onChange} />
      <span className="ml-1">{displayName}</span>
    </label>
  );
}
