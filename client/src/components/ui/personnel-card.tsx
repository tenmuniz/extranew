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
      <div className="assigned-person bg-white p-1 rounded text-xs shadow flex justify-between items-center">
        <span>{personnel.name}</span>
        {onRemove && (
          <button 
            className="text-red-500 hover:text-red-700"
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
        "personnel-card bg-[#F5F7FA] hover:bg-[#F5F7FA]/70 p-3 rounded flex justify-between items-center",
        isDraggable && "cursor-grab"
      )}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      data-id={personnel.id}
    >
      <div className="flex items-center">
        <div className="bg-[#1A3A5F] text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">
          <span className="font-medium text-sm">{getRankDisplay(personnel.rank)}</span>
        </div>
        <div>
          <p className="font-medium">{personnel.name}</p>
          <p className="text-xs text-[#708090]">
            {getRankFullName(personnel.rank)} • Extras: {personnel.extras || 0}
          </p>
        </div>
      </div>
      <div>
        <span className="badge bg-green-100 text-green-800 text-xs py-1 px-2 rounded-full">
          Disponível
        </span>
      </div>
    </div>
  );
}
