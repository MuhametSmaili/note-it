import NoteEditor from '@components/NoteEditor';
import { rootRender } from '@utils/render';

const App: React.FC = () => {
  return (
    <div style={{ width: '500px' }}>
      <NoteEditor />
    </div>
  );
};

rootRender.render(<App />);
