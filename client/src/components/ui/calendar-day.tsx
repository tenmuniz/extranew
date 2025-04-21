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

  return (
    <div
      className={cn(
        "calendar-day rounded min-h-[120px] p-2",
        isCurrentMonth ? "bg-[#F5F7FA]" : "bg-gray-200 opacity-50",
        isDisabled && "cursor-not-allowed bg-opacity-50"
      )}
      data-date={date.toISOString().split('T')[0]}
      onDragOver={isDisabled ? undefined : onDragOver}
      onDrop={isDisabled ? undefined : onDrop}
    >
      <div className="flex justify-between items-center mb-2">
        <span className={cn("font-medium", !isCurrentMonth && "text-gray-400")}>
          {dayOfMonth}
        </span>
        {isCurrentMonth && (
          <span className={cn("text-xs text-white px-1 rounded", dayColorClass)}>
            {dayOfWeekAbbr}
          </span>
        )}
      </div>
      {isCurrentMonth && <div className="assigned-personnel space-y-1">{children}</div>}
    </div>
  );
}
