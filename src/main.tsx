import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/resourcePreloader' // Initialize resource preloader

createRoot(document.getElementById("root")!).render(<App />);
