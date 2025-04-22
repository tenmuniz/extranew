import { useEffect, useState } from "react";
import { hasPendingActions, syncPendingActions } from "@/lib/offline";

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Verificar status online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkForPendingChanges();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Verificar inicialmente se há mudanças pendentes
    checkForPendingChanges();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Verificar a cada 60 segundos se há alterações pendentes quando online
  useEffect(() => {
    if (!isOnline) return;
    
    const intervalId = setInterval(() => {
      checkForPendingChanges();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [isOnline]);

  // Verifica se há mudanças pendentes e sincroniza se necessário
  const checkForPendingChanges = async () => {
    try {
      const pending = await hasPendingActions();
      setHasPending(pending);
      
      // Se online e houver alterações pendentes, sincronizar
      if (isOnline && pending && !isSyncing) {
        syncChanges();
      }
    } catch (error) {
      console.error("Erro ao verificar alterações pendentes:", error);
    }
  };

  // Sincronizar mudanças com o servidor
  const syncChanges = async () => {
    if (!isOnline || isSyncing) return;
    
    try {
      setIsSyncing(true);
      
      // Mostrar indicador visual de sincronização
      const syncIndicator = document.getElementById('sync-indicator');
      if (syncIndicator) {
        syncIndicator.style.display = 'block';
      }
      
      const success = await syncPendingActions();
      
      if (success) {
        setHasPending(false);
        setLastSync(new Date());
      }
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
    } finally {
      // Esconder indicador após um pequeno atraso para garantir visibilidade
      setTimeout(() => {
        setIsSyncing(false);
        const syncIndicator = document.getElementById('sync-indicator');
        if (syncIndicator) {
          syncIndicator.style.display = 'none';
        }
      }, 1500);
    }
  };

  // Retornar null quando tudo estiver normal (online, sem alterações pendentes)
  if (isOnline && !hasPending && !isSyncing) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px 15px',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        zIndex: 1000,
        fontSize: '14px',
        backgroundColor: isOnline ? '#047857' : '#dc2626',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '250px',
        animation: 'fadeIn 0.3s ease'
      }}
    >
      <div 
        style={{ 
          width: '10px', 
          height: '10px', 
          borderRadius: '50%', 
          backgroundColor: isOnline ? 'white' : '#fecaca',
          boxShadow: '0 0 5px rgba(255,255,255,0.5)'
        }} 
      />
      
      <div>
        {!isOnline && (
          <span>Offline - Alterações são salvas localmente</span>
        )}
        
        {isOnline && hasPending && isSyncing && (
          <span>Sincronizando alterações com o servidor...</span>
        )}
        
        {isOnline && hasPending && !isSyncing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>Alterações pendentes para sincronizar</span>
            <button 
              onClick={syncChanges}
              style={{
                backgroundColor: 'white',
                color: '#047857',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                alignSelf: 'flex-start'
              }}
            >
              Sincronizar agora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}