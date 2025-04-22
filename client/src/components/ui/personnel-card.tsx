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
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isDraggable) return;
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
        className="assigned-person relative p-2 rounded-md text-xs shadow-sm w-full mb-1 overflow-hidden"
        style={{
          background: getGradient(),
          borderLeft: `3px solid ${personnel.platoon ? getGarrisonColor(personnel.platoon) : "#1A3A5F"}`,
        }}
      >
        <div className="flex items-center justify-between w-full">
          {/* Nome do militar com o rank como prefixo e símbolo */}
          <div className="flex items-center space-x-1.5 overflow-hidden">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center">
              <div className="text-white text-[9px]">{getRankSymbols(personnel.rank)}</div>
            </div>
            <div className="truncate">
              <span className="font-medium text-gray-800">{personnel.name}</span>
            </div>
          </div>
          
          {/* Botão de remover */}
          {onRemove && (
            <button 
              className="ml-1 flex-shrink-0 w-5 h-5 rounded-full bg-white/80 flex items-center justify-center text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors duration-150 shadow-sm"
              onClick={onRemove}
              aria-label="Remover"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
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
        isDraggable && "cursor-grab active:cursor-grabbing"
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
        className="p-3 flex flex-col"
        style={{ background: getGradientBackground() }}
      >
        {/* Informações principais - Patente e Nome */}
        <div className="flex items-center w-full mb-2">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-sm"
            style={{ 
              background: `linear-gradient(135deg, #1A3A5F, #2c5a8c)` 
            }}
          >
            <div className="text-white">{getRankSymbols(personnel.rank)}</div>
          </div>
          <div className="w-full">
            <p className="font-bold text-gray-900 text-sm leading-tight">{personnel.name}</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {getRankFullName(personnel.rank)}
            </p>
          </div>
        </div>
        
        {/* Barra inferior com detalhes e status */}
        <div className="flex justify-between items-center mt-1 w-full">
          <div className="flex items-center space-x-2">
            {/* Contador de Extras */}
            <div className="rounded-md px-2 py-0.5 bg-blue-50 border border-blue-100">
              <span className="text-xs font-medium text-blue-700">{personnel.extras || 0} extras</span>
            </div>
            
            {/* Badge de Guarnição */}
            {personnel.platoon && (
              <div className="rounded-md px-2 py-0.5 text-white text-xs font-semibold"
                   style={{ backgroundColor: getGarrisonColor(personnel.platoon) }}>
                GU {personnel.platoon}
              </div>
            )}
          </div>
          
          {/* Badge de status */}
          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
              Disponível
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}