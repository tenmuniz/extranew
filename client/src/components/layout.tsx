import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-[#F5F7FA] font-body">
      {/* Header com gradiente e visual moderno */}
      <header className="relative bg-gradient-to-r from-[#0F2B4A] via-[#1A3A5F] to-[#2B517D] text-white shadow-lg">
        {/* Barra decorativa superior */}
        <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-red-800 to-[#4A6741]"></div>
        
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-4 relative">
                <div className="h-12 w-12 bg-gradient-to-br from-[#5A7751] to-[#3A5731] rounded-lg flex items-center justify-center shadow-md transform rotate-45">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-[#4A6741] shadow-inner transform -rotate-45">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-yellow-300"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5))" }}
                    >
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <h1 className="font-heading font-bold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-white" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
                  Sistema de Escala
                </h1>
                <div className="text-sm font-medium text-blue-100 opacity-90">20ª Companhia Independente de Polícia Militar</div>
              </div>
            </div>
            
            {/* Decoração do lado direito */}
            <div className="hidden md:flex space-x-1">
              <div className="h-8 w-2 bg-yellow-400 rounded-sm opacity-70"></div>
              <div className="h-6 w-2 bg-red-800 rounded-sm opacity-70"></div>
              <div className="h-10 w-2 bg-[#4A6741] rounded-sm opacity-70"></div>
            </div>
          </div>
        </div>
        
        {/* Decoração inferior */}
        <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-[#4A6741] via-red-800 to-yellow-400 opacity-50"></div>
      </header>

      {/* Main Content com sombra sutil */}
      <main className="flex-grow container mx-auto px-4 py-6 relative z-10">
        <div className="bg-white/40 backdrop-blur-sm shadow-sm rounded-lg p-6">
          {children}
        </div>
      </main>

      {/* Footer modernizado */}
      <footer className="bg-gradient-to-r from-[#0F2B4A] via-[#1A3A5F] to-[#2B517D] text-white py-4 mt-6 shadow-inner">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-80">© {new Date().getFullYear()} Sistema de Escala - 20ªCIPM. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Toast notification container */}
      <Toaster />
    </div>
  );
}
