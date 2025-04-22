import { ReactNode } from "react";
import { cn, getDayColorClass, getDayOfWeekAbbr, getActiveGuarnitionForDay, getGarrisonColor, isWeekday } from "@/lib/utils";
import { OperationType } from "@shared/schema";

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isDisabled?: boolean;
  children?: ReactNode;
  onDragOver?: React.DragEventHandler;
  onDrop?: React.DragEventHandler;
  activeOperation: OperationType;
  assignmentsCount?: number;
}

export function CalendarDay({
  date,
  isCurrentMonth,
  isDisabled = false,
  children,
  onDragOver,
  onDrop,
  activeOperation,
  assignmentsCount = 0
}: CalendarDayProps) {
  const dayOfMonth = date.getDate();
  const dayOfWeekAbbr = getDayOfWeekAbbr(date);
  const dayColorClass = getDayColorClass(date);

  // Verificar se é hoje
  const isToday = new Date().toDateString() === date.toDateString();
  
  // Determinar a cor de fundo com base no status de preenchimento
  const getBackgroundColor = () => {
    if (!isCurrentMonth) return "bg-white";
    if (isDisabled) return "bg-gray-100";
    
    // Determinar quantos militares são necessários para a operação
    const requiredAssignments = activeOperation === "PMF" ? 3 : 
                               (activeOperation === "ESCOLA" && isWeekday(date)) ? 2 : 0;
    
    if (requiredAssignments === 0) return "bg-white";
    
    if (assignmentsCount === 0) return "bg-white";
    if (assignmentsCount < requiredAssignments) return "bg-yellow-50";
    if (assignmentsCount >= requiredAssignments) return "bg-green-50";
    
    return "bg-white";
  };
  
  // Verificar qual guarnição está ativa para o dia
  const activeGuarnition = getActiveGuarnitionForDay(date);
  const guarnitionColor = getGarrisonColor(activeGuarnition);

  // Gerar um gradiente para o fundo do card
  const generateCardGradient = () => {
    // Criar uma versão mais clara da cor para o gradiente
    const baseColor = guarnitionColor;
    return `linear-gradient(145deg, ${baseColor}10 0%, ${baseColor}05 100%)`;
  };

  // Determinar quantos militares são necessários para a operação
  const requiredAssignments = activeOperation === "PMF" ? 3 : 
         (activeOperation === "ESCOLA" && isWeekday(date)) ? 2 : 0;
  
  // Definir classe para o indicador de preenchimento
  const getOccupationIndicator = () => {
    if (isDisabled) return "";
    
    if (requiredAssignments === 0) return "bg-gray-200";
    
    if (assignmentsCount === 0) return "bg-red-400";
    if (assignmentsCount < requiredAssignments) return "bg-yellow-400";
    if (assignmentsCount >= requiredAssignments) return "bg-green-400";
    
    return "bg-gray-200";
  };

  return (
    <div
      className={cn(
        "calendar-day rounded-xl min-h-[120px] sm:min-h-[160px] p-0 overflow-hidden border transition-all duration-200 hover:shadow-lg relative touch-manipulation",
        isCurrentMonth 
          ? "shadow-md border-[#E7EBF0] opacity-100" 
          : "border-dashed border-gray-300 opacity-80",
        isDisabled && "cursor-not-allowed bg-opacity-30",
        isToday && "ring-2 ring-blue-400 ring-offset-1"
      )}
      style={{ 
        background: generateCardGradient(),
      }}
      data-date={date.toISOString().split('T')[0]}
      onDragOver={isDisabled ? (e: React.DragEvent) => e.preventDefault() : onDragOver}
      onDrop={isDisabled ? (e: React.DragEvent) => e.preventDefault() : onDrop}
    >
      {/* Indicador de ocupação na lateral */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          getOccupationIndicator()
        )}
      />
      
      {/* Header do card com dia e guarnição */}
      <div 
        className="flex justify-between items-center px-2 sm:px-3 py-1 sm:py-2 text-white"
        style={{ 
          backgroundColor: guarnitionColor,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
      >
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider font-medium">GU {activeGuarnition}</span>
          <span className={cn(
            "font-bold text-white text-xl sm:text-2xl leading-tight",
            isToday && "underline"
          )}>
            {dayOfMonth.toString().padStart(2, '0')}
          </span>
        </div>
        <div>
          <span className={cn(
            "text-[10px] sm:text-xs uppercase px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-bold bg-white/30 backdrop-blur-sm",
          )}>
            {dayOfWeekAbbr}
          </span>
        </div>
      </div>
      
      {/* Container para os militares designados */}
      <div className={cn(
        "assigned-personnel px-1.5 sm:px-2 pt-1.5 sm:pt-2 pb-1 relative",
        !isDisabled && "min-h-[70px] sm:min-h-[100px]"
      )}>
        <div className="flex flex-col w-full gap-1">
          {children}
        </div>
        
        {/* Estado vazio com instruções para arrastar um militar */}
        {!children && !isDisabled && (
          <div className="flex items-center justify-center h-full py-4 sm:py-6 opacity-60 hover:opacity-100 transition-opacity">
            <div className="text-gray-500 text-[10px] sm:text-xs text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="block">Arraste um militar</span>
            </div>
          </div>
        )}
        
        {/* Etiqueta para meses diferentes */}
        {!isCurrentMonth && (
          <div className="absolute top-1 sm:top-2 right-1 sm:right-2 z-10">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 px-1 sm:px-1.5 py-0 sm:py-0.5 text-[8px] sm:text-[10px] font-semibold">
              {date.toLocaleDateString('pt-BR', {month: 'short'})}
            </div>
          </div>
        )}
        
        {/* Indicador de quantidade de militares */}
        {!isDisabled && activeOperation && (
          <div className="absolute bottom-1 right-1 sm:right-2 text-[10px] sm:text-xs font-medium">
            <span className={cn(
              "px-1 sm:px-1.5 py-0 sm:py-0.5 rounded-md", 
              assignmentsCount === 0 ? "bg-red-100 text-red-800" :
              assignmentsCount < requiredAssignments ? "bg-yellow-100 text-yellow-800" :
              "bg-green-100 text-green-800"
            )}>
              {assignmentsCount}/{requiredAssignments}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
