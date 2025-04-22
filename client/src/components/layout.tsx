import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import PMBrasao from "@/components/ui/LogoComponent";

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
                <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-white/50 shadow-lg bg-white">
                  <PMBrasao />
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
