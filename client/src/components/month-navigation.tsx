import { formatMonthYear } from "@/lib/utils";
import { OperationType } from "@shared/schema";

interface MonthNavigationProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onCurrentMonth: () => void;
  onNextMonth: () => void;
  activeOperation: OperationType;
}

export function MonthNavigation({
  currentDate,
  onPreviousMonth,
  onCurrentMonth,
  onNextMonth,
  activeOperation
}: MonthNavigationProps) {
  const formattedDate = formatMonthYear(currentDate);
  const operationTitle = activeOperation === "PMF" ? "Polícia Mais Forte" : "Escola Segura";

  return (
    <div className="flex flex-col mb-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-3xl font-bold text-[#1A3A5F]">
          {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
        </h2>
        <div className="flex space-x-2">
          <button
            className="bg-gray-200 hover:bg-gray-300 text-[#1A3A5F] p-2 rounded"
            onClick={onPreviousMonth}
            aria-label="Mês anterior"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            className="bg-[#1A3A5F] hover:bg-[#1A3A5F]/90 text-white py-2 px-4 rounded font-medium"
            onClick={onCurrentMonth}
          >
            Mês Atual
          </button>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-[#1A3A5F] p-2 rounded"
            onClick={onNextMonth}
            aria-label="Próximo mês"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
      <p className="text-[#4A6741] font-medium mt-1">Operação {operationTitle}</p>
    </div>
  );
}
