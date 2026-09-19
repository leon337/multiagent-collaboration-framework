import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');

createRoot(root).render(
  <StrictMode>
    <main style={{fontFamily:'system-ui',padding:32}}>
      <h1>MCF Content Studio N4</h1>
      <p>Component track loaded. Video Lab is integrated during fan-in.</p>
    </main>
  </StrictMode>,
);
