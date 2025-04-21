import { Personnel } from "@shared/schema";
import { cn } from "@/lib/utils";

interface PersonnelCardProps {
  personnel: Personnel;
  isAssigned?: boolean;
  isDraggable?: boolean;
  onRemove?: () => void;
}

// Get rank initials display name
const getRankDisplay = (rank: string) => {
  return rank;
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
      rank: personnel.rank
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (isAssigned) {
    return (
      <div className="assigned-person bg-white p-2 rounded-md text-xs shadow-sm hover:shadow-md border border-[#E7EBF0] flex justify-between items-center transition-all duration-200">
        <div className="flex items-center space-x-1">
          <div className="bg-[#1A3A5F] text-white w-4 h-4 rounded-full flex items-center justify-center mr-1 shrink-0">
            <span className="font-medium text-[8px]">{personnel.rank}</span>
          </div>
          <span className="font-medium truncate">{personnel.name}</span>
        </div>
        {onRemove && (
          <button 
            className="text-red-500 hover:text-red-700 ml-1 p-1 rounded-full hover:bg-red-50 transition-colors"
            onClick={onRemove}
            aria-label="Remover"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "personnel-card bg-white hover:bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow border border-[#E7EBF0] flex justify-between items-center transition-all duration-200",
        isDraggable && "cursor-grab"
      )}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      data-id={personnel.id}
    >
      <div className="flex items-center">
        <div className="bg-gradient-to-r from-[#1A3A5F] to-[#2C5282] text-white w-9 h-9 rounded-full flex items-center justify-center mr-3 shadow-sm">
          <span className="font-bold text-xs">{getRankDisplay(personnel.rank)}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-800">{personnel.name}</p>
          <div className="flex items-center mt-1">
            <span className="text-xs text-[#708090] font-medium">
              {getRankFullName(personnel.rank)}
            </span>
            <div className="w-1 h-1 rounded-full bg-gray-400 mx-2"></div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
              Extras: {personnel.extras || 0}
            </span>
          </div>
        </div>
      </div>
      <div>
        <span className="badge bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs py-1 px-3 rounded-full font-medium shadow-sm">
          Disponível
        </span>
      </div>
    </div>
  );
}
