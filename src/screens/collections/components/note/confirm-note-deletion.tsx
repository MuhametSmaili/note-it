import { Button } from "@components";

type ConfirmDeleteProps = {
  onConfirmHandler: () => void;
  onDeclineHandler: () => void;
};

export const ConfirmNoteDeletion = ({ onConfirmHandler, onDeclineHandler }: ConfirmDeleteProps) => {
  return (
    <div className="absolute z-10 flex h-full flex-col items-center justify-center bg-primary">
      <h2 className="mb-5 text-center text-xl">Are you sure you want to delete this note?</h2>
      <div className="flex w-full justify-center">
        <Button variant="primary" onClick={onDeclineHandler}>
          No
        </Button>
        <Button variant="inverse" onClick={onConfirmHandler}>
          Yes
        </Button>
      </div>
    </div>
  );
};
