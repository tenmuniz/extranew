import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./pwa-install.js"; // Importa o script de instalação PWA

createRoot(document.getElementById("root")!).render(<App />);
