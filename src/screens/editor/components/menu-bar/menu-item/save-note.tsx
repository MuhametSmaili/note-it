import { Button } from "@components";
import Save from "@icons/save.svg";

export const SaveNote = ({ onSave }: { onSave: () => void }) => (
  <Button variant="inverse" size="sm" aria-label="Save note" onClick={onSave}>
    <Save />
  </Button>
);
