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
      rank: personnel.rank,
      platoon: personnel.platoon || "EXPEDIENTE"
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (isAssigned) {
    return (
      <div className="assigned-person bg-white p-1.5 px-2 rounded text-xs shadow w-full mb-1 border border-gray-100">
        <div className="flex flex-col w-full">
          {/* Nome do militar com o rank como prefixo */}
          <div className="font-medium text-xs leading-tight w-full mb-0.5 whitespace-normal break-words hyphens-auto">
            <span className="font-bold">{personnel.rank}</span> {personnel.name}
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
        "personnel-card bg-white p-3 rounded border border-gray-200 flex justify-between items-center",
        isDraggable && "cursor-grab"
      )}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      data-id={personnel.id}
    >
      <div className="flex items-center">
        <div className="bg-[#1A3A5F] text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">
          <span className="font-bold text-xs">{getRankDisplay(personnel.rank)}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-800">{personnel.name}</p>
          <div className="flex items-center mt-1">
            <span className="text-xs text-gray-500">
              {getRankFullName(personnel.rank)}
            </span>
            <span className="mx-2 text-gray-300">•</span>
            <span className="text-xs">
              Extras: <span className="font-medium text-blue-600">{personnel.extras || 0}</span>
            </span>
            {personnel.platoon && (
              <>
                <span className="mx-2 text-gray-300">•</span>
                <span className="text-xs bg-gray-100 py-0.5 px-1.5 rounded-sm">
                  {personnel.platoon}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div>
        {personnel.platoon === "EXPEDIENTE" ? (
          <span className="badge bg-green-100 text-green-800 text-xs py-1 px-2 rounded-full">
            Disponível
          </span>
        ) : (
          <span className={`badge text-xs py-1 px-2 rounded-full ${
            // Verificar se está em período de serviço com base no dia atual
            // (Simplificação da lógica para visualização)
            (() => {
              const day = new Date().getDate();
              let activeGuarnitionForDay = "";
              
              if (day <= 7) {
                activeGuarnitionForDay = "ALFA";
              } else if (day <= 14) {
                activeGuarnitionForDay = "BRAVO";
              } else if (day <= 21) {
                activeGuarnitionForDay = "CHARLIE";
              } else if (day <= 28) {
                activeGuarnitionForDay = "ALFA";
              } else {
                activeGuarnitionForDay = (day <= 30) ? "BRAVO" : "CHARLIE";
              }
              
              return personnel.platoon === activeGuarnitionForDay 
                ? "bg-red-100 text-red-800" 
                : "bg-green-100 text-green-800";
            })()
          }`}>
            {(() => {
              const day = new Date().getDate();
              let activeGuarnitionForDay = "";
              
              if (day <= 7) {
                activeGuarnitionForDay = "ALFA";
              } else if (day <= 14) {
                activeGuarnitionForDay = "BRAVO";
              } else if (day <= 21) {
                activeGuarnitionForDay = "CHARLIE";
              } else if (day <= 28) {
                activeGuarnitionForDay = "ALFA";
              } else {
                activeGuarnitionForDay = (day <= 30) ? "BRAVO" : "CHARLIE";
              }
              
              return personnel.platoon === activeGuarnitionForDay 
                ? "Em Serviço" 
                : "Disponível";
            })()}
          </span>
        )}
      </div>
    </div>
  );
}
