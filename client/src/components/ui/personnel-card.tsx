import { Personnel } from "@shared/schema";
import { cn, getGarrisonColor } from "@/lib/utils";

interface PersonnelCardProps {
  personnel: Personnel;
  isAssigned?: boolean;
  isDraggable?: boolean;
  onRemove?: () => void;
}

// Função para gerar elementos de símbolos de patentes e graduações
const getRankSymbols = (rank: string) => {
  switch(rank) {
    case "CAP":
      return (
        <div className="flex">
          <span className="text-yellow-400 text-[10px] font-bold">★★★</span>
        </div>
      );
    case "1TEN":
      return (
        <div className="flex">
          <span className="text-yellow-400 text-[10px] font-bold">★★</span>
        </div>
      );
    case "TEN":
    case "2TEN":
      return (
        <div className="flex">
          <span className="text-yellow-400 text-[10px] font-bold">★</span>
        </div>
      );
    case "SUBTEN":
      return (
        <div className="flex flex-col items-center">
          <span className="text-yellow-300 text-[10px] font-bold">≡≡≡</span>
        </div>
      );
    case "1SGT":
      return (
        <div className="flex flex-col items-center">
          <div className="text-yellow-300 text-[10px] leading-3 text-center font-bold">
            <div>≡≡≡</div>
            <div>∨</div>
          </div>
        </div>
      );
    case "2SGT":
      return (
        <div className="flex flex-col items-center">
          <div className="text-yellow-300 text-[10px] leading-3 text-center font-bold">
            <div>≡≡</div>
            <div>∨</div>
          </div>
        </div>
      );
    case "3SGT":
      return (
        <div className="flex flex-col items-center">
          <div className="text-yellow-300 text-[10px] leading-3 text-center font-bold">
            <div>≡</div>
            <div>∨</div>
          </div>
        </div>
      );
    case "CB":
      return (
        <div className="flex flex-col items-center">
          <div className="text-yellow-300 text-[10px] font-bold">
            <div>∧∧</div>
          </div>
        </div>
      );
    case "SD":
      return (
        <div className="flex flex-col items-center">
          <div className="text-yellow-300 text-[10px] font-bold">
            <div>∧</div>
          </div>
        </div>
      );
    default:
      return rank;
  }
};

// Get rank full name
const getRankFullName = (rank: string) => {
  const rankMap: Record<string, string> = {
    SD: "Soldado",
    CB: "Cabo",
    "3SGT": "3º Sargento",
    "2SGT": "2º Sargento",
    "1SGT": "1º Sargento",
    SUBTEN: "Sub-Tenente",
    TEN: "Tenente",
    "1TEN": "1º Tenente",
    CAP: "Capitão",
  };
  return rankMap[rank] || rank;
};

export function PersonnelCard({
  personnel,
  isAssigned = false,
  isDraggable = true,
  onRemove
}: PersonnelCardProps) {
  // Função para verificar se o militar atingiu o limite de extras
  const hasReachedMaxExtras = () => {
    return (personnel.extras || 0) >= 12;
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isDraggable) return;
    
    // Impedir que militares com 12 ou mais extras sejam arrastados
    if (hasReachedMaxExtras()) {
      e.preventDefault();
      
      // Mostrar notificação de erro elegante
      const notification = document.createElement('div');
      notification.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-xl z-50 border-l-4 border-red-500 animate-in fade-in duration-300';
      notification.style.maxWidth = '400px';
      notification.style.width = '90%';
      
      notification.innerHTML = `
        <div class="flex items-center mb-2">
          <svg class="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <h3 class="text-lg font-semibold text-gray-900">Limite Atingido</h3>
        </div>
        <p class="text-sm text-gray-700">
          ${personnel.name} já atingiu o limite máximo de 12 extras e não pode ser escalado novamente.
        </p>
        <div class="mt-3 flex justify-end">
          <button class="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm">Entendi</button>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Adicionar eventos
      const closeBtn = notification.querySelector('button');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          notification.classList.add('fade-out');
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 300);
        });
      }
      
      // Auto-fechar após 4 segundos
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.classList.add('fade-out');
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 300);
        }
      }, 4000);
      
      return;
    }
    
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: personnel.id,
      name: personnel.name,
      rank: personnel.rank,
      platoon: personnel.platoon || "EXPEDIENTE"
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (isAssigned) {
    // Criar gradiente com base na guarnição do militar
    const getGradient = () => {
      const baseColor = personnel.platoon 
        ? getGarrisonColor(personnel.platoon)
        : "#1A3A5F";
      return `linear-gradient(135deg, ${baseColor}10 0%, ${baseColor}05 100%)`;
    };
    
    return (
      <div 
        className="assigned-person relative p-2.5 rounded-md text-xs shadow-sm w-full mb-1 overflow-hidden touch-manipulation"
        style={{
          background: getGradient(),
          borderLeft: `3px solid ${personnel.platoon ? getGarrisonColor(personnel.platoon) : "#1A3A5F"}`,
        }}
      >
        <div className="flex flex-col w-full">
          {/* Nome do militar com o rank como prefixo e símbolo */}
          <div className="flex items-center mb-1.5">
            <div className="flex items-center flex-grow min-w-0">
              <div className="flex-shrink-0 w-6 h-6 mr-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center">
                <div className="text-white text-[9px]">{getRankSymbols(personnel.rank)}</div>
              </div>
              <div className="flex items-center min-w-0">
                <p className="font-medium text-gray-800 text-sm whitespace-nowrap overflow-hidden text-ellipsis"
                   style={{ maxWidth: "calc(100% - 24px)" }}>
                  {personnel.name}
                </p>
                
                {/* Botão de remover ao lado do nome */}
                {onRemove && (
                  <button 
                    className="flex-shrink-0 w-5 h-5 ml-1 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 hover:text-white transition-colors duration-150 shadow-sm remove-button touch-manipulation prevent-select"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Botão de remover clicado");
                      if (typeof onRemove === 'function') {
                        try {
                          onRemove();
                        } catch (error) {
                          console.error("Erro ao executar a função onRemove:", error);
                        }
                      }
                    }}
                    aria-label="Remover"
                    type="button"
                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="touch-target-helper"></span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Criar gradiente conforme a guarnição
  const getGradientBackground = () => {
    const baseColor = personnel.platoon 
      ? getGarrisonColor(personnel.platoon)
      : "#1A3A5F";
    return `linear-gradient(145deg, ${baseColor}08 0%, white 100%)`;
  };

  return (
    <div
      className={cn(
        "personnel-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col w-full",
        isDraggable && "cursor-grab active:cursor-grabbing",
        "touch-manipulation" // Melhora interação em dispositivos touch
      )}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      data-id={personnel.id}
    >
      {/* Cabeçalho com cor da guarnição */}
      <div 
        className="w-full h-2"
        style={{ 
          backgroundColor: personnel.platoon ? getGarrisonColor(personnel.platoon) : "#1A3A5F",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)" 
        }}
      />
      
      {/* Conteúdo principal */}
      <div 
        className="p-2 sm:p-3 flex flex-col"
        style={{ background: getGradientBackground() }}
      >
        {/* Informações principais - Patente e Nome com botão de excluir ao lado */}
        <div className="flex items-center w-full mb-2">
          <div className="flex items-center min-w-0 flex-grow">
            <div 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0 shadow-sm"
              style={{ 
                background: `linear-gradient(135deg, #1A3A5F, #2c5a8c)` 
              }}
            >
              <div className="text-white">{getRankSymbols(personnel.rank)}</div>
            </div>
            <div className="min-w-0 flex flex-col flex-grow mr-1">
              <div className="flex items-center w-full">
                <p className="font-bold text-gray-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-grow">
                  {personnel.name}
                </p>
                
                {/* Botão de remover ao lado do nome */}
                {onRemove && (
                  <button 
                    className="flex-shrink-0 w-6 h-6 ml-1 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 hover:text-white transition-colors duration-150 shadow-sm remove-button touch-manipulation prevent-select"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Botão de remover clicado");
                      if (typeof onRemove === 'function') {
                        try {
                          onRemove();
                        } catch (error) {
                          console.error("Erro ao executar a função onRemove:", error);
                        }
                      }
                    }}
                    aria-label="Remover"
                    type="button"
                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="touch-target-helper"></span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                {getRankFullName(personnel.rank)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Barra inferior com detalhes e status */}
        <div className="flex flex-wrap justify-between items-center mt-1 w-full gap-y-2">
          <div className="flex items-center space-x-2">
            {/* Contador de Extras - Versão 3D com alerta quando chegar a 12 */}
            <div 
              className={cn(
                "px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center shadow-md relative overflow-hidden transform hover:scale-105 transition-all duration-150",
                (personnel.extras || 0) >= 12 
                  ? "bg-gradient-to-r from-red-600 to-red-700 border border-red-800" 
                  : (personnel.extras || 0) >= 9
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 border border-orange-700"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 border border-blue-700"
              )}
              style={{ 
                textShadow: "0px 1px 2px rgba(0,0,0,0.2)",
                boxShadow: "0 2px 3px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.2)"
              }}
            >
              <span className="absolute inset-0 bg-black opacity-5 rounded-lg"></span>
              <span className="mr-1 font-bold text-white text-sm">
                {personnel.extras || 0}
              </span>
              <span className="text-white/90 text-xs">extras</span>
              {(personnel.extras || 0) >= 12 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></span>
              )}
            </div>
            
            {/* Badge de Guarnição */}
            {personnel.platoon && (
              <div className="rounded-md px-2 py-0.5 text-white text-xs font-semibold"
                   style={{ backgroundColor: getGarrisonColor(personnel.platoon) }}>
                GU {personnel.platoon}
              </div>
            )}
          </div>
          
          {/* Badge de status - Muda com base na quantidade de extras */}
          <div className="flex items-center">
            {(personnel.extras || 0) >= 12 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
                Limite
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                Disponível
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}