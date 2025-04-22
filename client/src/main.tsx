import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { initOfflineSupport } from "@/lib/offline";
import App from "./App";
import "./index.css";

// Componente raiz com inicialização do suporte offline
function Root() {
  const [offlineInitialized, setOfflineInitialized] = useState(false);
  
  useEffect(() => {
    // Inicializar suporte offline quando o componente for montado
    const initOffline = async () => {
      try {
        await initOfflineSupport();
        setOfflineInitialized(true);
        console.log("Suporte offline inicializado com sucesso");
      } catch (error) {
        console.error("Erro ao inicializar suporte offline:", error);
        // Mesmo com erro, permitir que o aplicativo continue funcionando
        setOfflineInitialized(true);
      }
    };
    
    initOffline();
  }, []);
  
  // Renderizar indicador de carregamento se o suporte offline ainda estiver sendo inicializado
  if (!offlineInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          Sistema de Escalas 20ª CIPM
        </div>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '5px solid rgba(255,255,255,0.3)', 
          borderTop: '5px solid white', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div>Inicializando suporte offline...</div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <App />
      <div id="sync-indicator" style={{
        display: 'none',
        position: 'fixed',
        bottom: '60px',
        right: '20px',
        padding: '10px 15px',
        backgroundColor: '#f97316',
        color: 'white',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        zIndex: 1000,
        fontSize: '14px',
        animation: 'fadeIn 0.3s ease-in-out'
      }}>
        Sincronizando dados...
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
