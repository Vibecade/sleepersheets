import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/resourcePreloader' // Initialize resource preloader
import { setupChunkLoadRecovery } from './utils/chunkLoadRecovery'

setupChunkLoadRecovery();

createRoot(document.getElementById("root")!).render(<App />);
