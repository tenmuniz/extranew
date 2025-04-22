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
    return (
      <div className="assigned-person bg-white p-1.5 px-2 rounded text-xs shadow w-full mb-1 border border-gray-100">
        <div className="flex flex-col w-full">
          {/* Nome do militar com o rank como prefixo e símbolo */}
          <div className="font-medium text-xs leading-tight w-full mb-0.5 whitespace-normal break-words hyphens-auto flex items-center">
            <span className="inline-flex items-center mr-1 bg-[#1A3A5F] text-white rounded-full w-5 h-5 justify-center">
              {getRankSymbols(personnel.rank)}
            </span>
            <span>{personnel.name}</span>
          </div>
          
          {/* Botão de remover em linha separada */}
          {onRemove && (
            <div className="flex justify-end w-full mt-0.5">
              <button 
                className="text-red-500 hover:text-red-700 flex-shrink-0"
                onClick={onRemove}
                aria-label="Remover"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "personnel-card bg-white p-3 rounded border border-gray-200 flex flex-col w-full",
        isDraggable && "cursor-grab"
      )}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      data-id={personnel.id}
    >
      {/* Cabeçalho com nome e rank */}
      <div className="flex items-center mb-2 w-full">
        <div className="bg-[#1A3A5F] text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
          {getRankSymbols(personnel.rank)}
        </div>
        <div className="w-full overflow-hidden">
          <p className="font-semibold text-gray-800 text-sm break-words">{personnel.name}</p>
          <span className="text-xs text-gray-500 block">
            {getRankFullName(personnel.rank)}
          </span>
        </div>
      </div>
      
      {/* Informações adicionais */}
      <div className="flex flex-wrap justify-between items-center w-full mt-1">
        <div className="flex flex-wrap items-center">
          <span className="text-xs mr-2">
            Extras: <span className="font-medium text-blue-600">{personnel.extras || 0}</span>
          </span>
          
          {personnel.platoon && (
            <span className="text-xs text-white py-0.5 px-1.5 rounded-sm inline-block mt-1" 
                  style={{ backgroundColor: getGarrisonColor(personnel.platoon) }}>
              {personnel.platoon}
            </span>
          )}
        </div>
        
        <div className="mt-1">
          <span className="badge text-xs py-1 px-2 rounded-full inline-block bg-green-100 text-green-800">
            Disponível
          </span>
        </div>
      </div>
    </div>
  );
}