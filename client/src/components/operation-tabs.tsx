import { OperationType } from "@shared/schema";
import { cn } from "@/lib/utils";

interface OperationTabsProps {
  activeOperation: OperationType;
  onOperationChange: (operation: OperationType) => void;
}

export function OperationTabs({ activeOperation, onOperationChange }: OperationTabsProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row bg-gradient-to-r from-gray-50 to-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
        <button
          className={cn(
            "relative group py-5 px-8 font-bold text-lg flex-1 flex items-center justify-center transition-all duration-300",
            activeOperation === "PMF"
              ? "bg-gradient-to-r from-[#1A3A5F] to-[#3066BE] text-white"
              : "text-gray-700 hover:bg-blue-50/60 hover:text-[#1A3A5F]"
          )}
          onClick={() => onOperationChange("PMF")}
        >
          {/* Efeito de luz ambiente quando estiver ativo */}
          {activeOperation === "PMF" && (
            <div className="absolute inset-0 -z-10">
              <div className="absolute -inset-2 bg-blue-500/20 blur-xl rounded-full opacity-75"></div>
            </div>
          )}
          
          {/* Efeito de brilho no hover (apenas quando não estiver ativo) */}
          {activeOperation !== "PMF" && (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#1A3A5F]/0 via-[#3066BE]/10 to-[#1A3A5F]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
          )}
          
          <div className="flex items-center justify-center">
            <div className={cn(
              "mr-3 p-2 rounded-lg transition-all duration-300",
              activeOperation === "PMF" 
                ? "bg-white/20" 
                : "bg-blue-100/50 group-hover:bg-blue-100"
            )}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={cn("h-6 w-6", 
                  activeOperation === "PMF" 
                    ? "text-white drop-shadow-lg" 
                    : "text-[#1A3A5F]"
                )}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex flex-col items-start">
              <span className={cn(
                "text-xs uppercase tracking-wide font-medium", 
                activeOperation === "PMF" ? "text-blue-100" : "text-blue-700"
              )}>
                Operação
              </span>
              <span className={cn(
                "font-bold", 
                activeOperation === "PMF" && "drop-shadow-md"
              )}>
                Polícia Mais Forte
              </span>
            </div>
          </div>
          
          {activeOperation === "PMF" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-white to-yellow-400"></div>
          )}
        </button>
        
        <button
          className={cn(
            "relative group py-5 px-8 font-bold text-lg flex-1 flex items-center justify-center transition-all duration-300",
            activeOperation === "ESCOLA"
              ? "bg-gradient-to-r from-[#4A6741] to-[#6BA368] text-white"
              : "text-gray-700 hover:bg-green-50/60 hover:text-[#4A6741]"
          )}
          onClick={() => onOperationChange("ESCOLA")}
        >
          {/* Efeito de luz ambiente quando estiver ativo */}
          {activeOperation === "ESCOLA" && (
            <div className="absolute inset-0 -z-10">
              <div className="absolute -inset-2 bg-green-500/20 blur-xl rounded-full opacity-75"></div>
            </div>
          )}
          
          {/* Efeito de brilho no hover (apenas quando não estiver ativo) */}
          {activeOperation !== "ESCOLA" && (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#4A6741]/0 via-[#6BA368]/10 to-[#4A6741]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
          )}
          
          <div className="flex items-center justify-center">
            <div className={cn(
              "mr-3 p-2 rounded-lg transition-all duration-300",
              activeOperation === "ESCOLA" 
                ? "bg-white/20" 
                : "bg-green-100/50 group-hover:bg-green-100"
            )}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={cn("h-6 w-6", 
                  activeOperation === "ESCOLA" 
                    ? "text-white drop-shadow-lg" 
                    : "text-[#4A6741]"
                )}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"
                />
              </svg>
            </div>
            <div className="flex flex-col items-start">
              <span className={cn(
                "text-xs uppercase tracking-wide font-medium", 
                activeOperation === "ESCOLA" ? "text-green-100" : "text-green-700"
              )}>
                Operação
              </span>
              <span className={cn(
                "font-bold", 
                activeOperation === "ESCOLA" && "drop-shadow-md"
              )}>
                Escola Segura
              </span>
            </div>
          </div>
          
          {activeOperation === "ESCOLA" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-white to-yellow-400"></div>
          )}
        </button>
      </div>
    </div>
  );
}
