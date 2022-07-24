import { createRoot } from 'react-dom/client';

const container = document.createElement('div');
container.className = 'h-screen';
document.body.appendChild(container);

export const rootRender = createRoot(container);
