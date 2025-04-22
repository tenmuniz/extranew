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
      {/* Cabeçalho com design moderno para a operação */}
      <div className={`relative overflow-hidden bg-gradient-to-r ${operationColor} text-white rounded-xl shadow-lg mb-4`}>
        {/* Efeitos decorativos */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mt-32 -mr-32 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -mb-32 -ml-32 blur-xl"></div>
        
        <div className="relative p-6 z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl shadow-inner mr-4">
                {operationIcon}
              </div>
              <div>
                <h2 className="text-lg font-semibold opacity-90 tracking-wide">Operação</h2>
                <h1 className="text-3xl font-bold tracking-tight" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
                  {operationTitle}
                </h1>
              </div>
            </div>
            
            <div className="w-full md:w-auto">
              <div className="px-5 py-3 bg-white/20 backdrop-blur-sm rounded-xl font-bold text-xl border border-white/30 shadow-xl" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Barra decorativa inferior */}
        <div className="w-full h-1.5 bg-gradient-to-r from-white/5 via-white/30 to-white/5"></div>
      </div>
      
      {/* Navegação do calendário com design elegante */}
      <div className={`relative flex justify-between items-center backdrop-blur-sm bg-white/80 border-2 ${operationBorder} rounded-xl p-4 shadow-lg`}>
        {/* Decoração de fundo sutil */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/80 to-white/0 rounded-xl -z-10"></div>
        
        <div className="hidden md:block">
          <div className={`text-transparent bg-clip-text bg-gradient-to-r ${operationColor} font-bold text-xl`}>
            {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
          </div>
        </div>
        
        <div className="flex items-center w-full md:w-auto justify-between md:justify-end space-x-2">
          <div className="md:hidden">
            <div className={`text-transparent bg-clip-text bg-gradient-to-r ${operationColor} font-bold text-xl`}>
              {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
            </div>
          </div>
          
          <div className="flex bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden">
            <button
              className="px-4 py-2.5 hover:bg-gray-50 active:bg-gray-100 text-gray-700 border-r border-gray-200 transition-all duration-200 flex items-center"
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
              className={`px-5 py-2.5 bg-gradient-to-r ${operationColor} text-white font-medium border-white/20 relative overflow-hidden group transition-all duration-300`}
              onClick={onCurrentMonth}
            >
              {/* Efeito de brilho no hover */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
              <span className="relative z-10 inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Mês Atual
              </span>
            </button>
            
            <button
              className="px-4 py-2.5 hover:bg-gray-50 active:bg-gray-100 text-gray-700 transition-all duration-200 flex items-center"
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
