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

  // Classes condicionais baseadas no tipo de operação
  const operationColor = activeOperation === "PMF" ? "from-[#1A3A5F] to-[#3066BE]" : "from-[#4A6741] to-[#6BA368]";
  const operationBgLight = activeOperation === "PMF" ? "bg-blue-50" : "bg-green-50";
  const operationBorder = activeOperation === "PMF" ? "border-blue-200" : "border-green-200";
  const operationIcon = activeOperation === "PMF" ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );

  return (
    <div className="mb-8">
      {/* Cabeçalho com destaque para a operação */}
      <div className={`bg-gradient-to-r ${operationColor} text-white rounded-xl shadow-lg p-5 mb-4`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {operationIcon}
            <div>
              <h2 className="text-xl font-semibold opacity-90">Operação</h2>
              <h1 className="text-3xl font-bold">{operationTitle}</h1>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg font-bold text-xl">
              {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Navegação do calendário */}
      <div className={`flex justify-between items-center ${operationBgLight} border ${operationBorder} rounded-lg p-3`}>
        <div className="md:hidden font-bold text-xl text-gray-800">
          {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
        </div>
        
        <div className="flex items-center">
          <div className="flex bg-white shadow-sm rounded-lg border border-gray-200">
            <button
              className="px-3 py-2 hover:bg-gray-100 text-gray-700 rounded-l-lg border-r border-gray-200 transition-colors"
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
              className={`px-4 py-2 bg-gradient-to-r ${operationColor} text-white font-medium border-r border-l border-white/20`}
              onClick={onCurrentMonth}
            >
              Mês Atual
            </button>
            
            <button
              className="px-3 py-2 hover:bg-gray-100 text-gray-700 rounded-r-lg transition-colors"
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
      </div>
    </div>
  );
}
