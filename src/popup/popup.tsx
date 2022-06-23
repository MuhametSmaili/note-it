import { rootRender } from '@utils/render';

const App: React.FC = () => {
  return <div style={{ width: '500px' }}></div>;
};

rootRender.render(<App />);
