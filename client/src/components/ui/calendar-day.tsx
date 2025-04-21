import { ReactNode } from "react";
import { cn, getDayColorClass, getDayOfWeekAbbr } from "@/lib/utils";

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
        "calendar-day rounded-lg min-h-[120px] p-2 border transition-all duration-200",
        isCurrentMonth 
          ? "bg-white shadow-sm border-[#E7EBF0] opacity-100" 
          : "bg-gray-100 opacity-50 border-gray-200",
        isDisabled && "cursor-not-allowed bg-opacity-30 bg-gray-100",
        isToday && "ring-2 ring-blue-400 ring-offset-1"
      )}
      data-date={date.toISOString().split('T')[0]}
      onDragOver={isDisabled ? undefined : onDragOver}
      onDrop={isDisabled ? undefined : onDrop}
    >
      <div className="flex justify-between items-center mb-3">
        <span className={cn(
          "font-medium text-lg", 
          !isCurrentMonth && "text-gray-400",
          isToday && "text-blue-600 font-bold"
        )}>
          {dayOfMonth}
        </span>
        {isCurrentMonth && (
          <span className={cn("text-xs text-white px-2 py-1 rounded-full font-semibold", dayColorClass)}>
            {dayOfWeekAbbr}
          </span>
        )}
      </div>
      {isCurrentMonth && (
        <div className={cn(
          "assigned-personnel relative",
          !isDisabled && "min-h-[80px]"
        )}>
          <div className="flex flex-col w-full px-0.5">
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
        </div>
      )}
    </div>
  );
}
