import NoteEditor from '@components/NoteEditor';
import { rootRender } from '@utils/render';

const App: React.FC = () => {
  return (
    <div>
      <NoteEditor />
    </div>
  );
};

rootRender.render(<App />);