import { ReactNode } from "react";
import { cn, getDayColorClass, getDayOfWeekAbbr, getActiveGuarnitionForDay, getGarrisonColor } from "@/lib/utils";

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isDisabled?: boolean;
  children?: ReactNode;
  onDragOver?: React.DragEventHandler;
  onDrop?: React.DragEventHandler;
}

export function CalendarDay({
  date,
  isCurrentMonth,
  isDisabled = false,
  children,
  onDragOver,
  onDrop
}: CalendarDayProps) {
  const dayOfMonth = date.getDate();
  const dayOfWeekAbbr = getDayOfWeekAbbr(date);
  const dayColorClass = getDayColorClass(date);

  // Verificar se é hoje
  const isToday = new Date().toDateString() === date.toDateString();
  
  return (
    <div
      className={cn(
        "calendar-day rounded-lg min-h-[90px] p-2 border transition-all duration-200",
        isCurrentMonth 
          ? "bg-white shadow-sm border-[#E7EBF0] opacity-100" 
          : "bg-white border-dashed border-gray-300 opacity-85",
        isDisabled && "cursor-not-allowed bg-opacity-30 bg-gray-100",
        isToday && "ring-2 ring-blue-400 ring-offset-1"
      )}
      data-date={date.toISOString().split('T')[0]}
      onDragOver={isDisabled ? (e: React.DragEvent) => e.preventDefault() : onDragOver}
      onDrop={isDisabled ? (e: React.DragEvent) => e.preventDefault() : onDrop}
    >
      {/* Barra superior com guarnição e data */}
      <div 
        className={cn(
          "flex justify-between items-center px-2 py-1 text-white mb-2 rounded-t-sm",
          !isCurrentMonth && "opacity-80"
        )}
        style={{ 
          backgroundColor: getGarrisonColor(getActiveGuarnitionForDay(date)) 
        }}
      >
        <span className="text-xs font-semibold">{getActiveGuarnitionForDay(date)}</span>
        <span className={cn(
          "font-medium text-white",
          isToday && "font-bold"
        )}>
          {dayOfMonth}
        </span>
      </div>
      <div className="flex justify-end mb-2">
        <span className={cn(
          "text-xs text-white px-2 py-1 rounded-full font-semibold", 
          dayColorClass,
          !isCurrentMonth && "opacity-50"
        )}>
          {dayOfWeekAbbr}
        </span>
      </div>
      <div className={cn(
        "assigned-personnel relative",
        !isDisabled && "min-h-[50px]"
      )}>
        <div className="flex flex-col w-full">
          {children}
        </div>
        {!children && !isDisabled && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="text-gray-400 text-xs text-center">
              <span className="block">Arraste um militar</span>
              <span className="block">para este dia</span>
            </div>
          </div>
        )}
        {!isCurrentMonth && (
          <div className="absolute top-1 right-1">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 px-1.5 py-0.5 text-[10px] font-medium">
              {date.toLocaleDateString('pt-BR', {month: 'short'})}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
