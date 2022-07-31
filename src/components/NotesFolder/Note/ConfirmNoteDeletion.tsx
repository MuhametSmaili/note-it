import { Button } from '@components/Elements';

type ConfirmDeleteProps = {
  onConfirmHandler: () => void;
  onDeclineHandler: () => void;
};

export const ConfirmNoteDeletion = ({ onConfirmHandler, onDeclineHandler }: ConfirmDeleteProps) => {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <h2 className="text-xl mb-5 text-center">Are you sure you want to delete this note?</h2>
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
