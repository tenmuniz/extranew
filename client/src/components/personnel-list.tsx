import { Personnel } from "@shared/schema";
import { PersonnelCard } from "@/components/ui/personnel-card";
import { useState, useEffect, useRef } from 'react';
// Substituindo o ícone de pesquisa da biblioteca por um SVG inline para evitar problemas
// import { Search } from "lucide-react"; 

interface PersonnelListProps {
  personnel: Personnel[];
}

export function PersonnelList({ personnel }: PersonnelListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPersonnel, setFilteredPersonnel] = useState<Personnel[]>(personnel);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Atualizar lista filtrada quando o termo de busca mudar
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPersonnel(personnel);
    } else {
      const normalized = searchTerm.trim().toLowerCase();
      const filtered = personnel.filter((person) => {
        // Buscar por nome, posto/graduação ou pelotão
        return (
          person.name.toLowerCase().includes(normalized) ||
          person.rank.toLowerCase().includes(normalized) ||
          person.platoon.toLowerCase().includes(normalized)
        );
      });
      setFilteredPersonnel(filtered);
    }
  }, [searchTerm, personnel]);

  // Limpar campo de busca
  const clearSearch = () => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="lg:w-1/4">
      <div className="bg-white rounded-lg shadow-md p-4 border border-[#E7EBF0]">
        <h3 className="font-heading font-bold text-xl text-[#1A3A5F] mb-3 flex items-center border-b pb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2 text-[#4A6741]"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          <span className="bg-gradient-to-r from-[#1A3A5F] to-[#4A6741] bg-clip-text text-transparent">
            Militares Disponíveis
          </span>
        </h3>
        
        {/* Campo de busca */}
        <div className="relative mb-3 flex items-center">
          <svg 
            className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar militar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A6741] focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Limpar busca"
            >
              ×
            </button>
          )}
        </div>
        
        {filteredPersonnel.length === 0 ? (
          <div className="p-4 text-center text-gray-500 border border-dashed rounded-lg">
            {searchTerm 
              ? `Nenhum militar encontrado para "${searchTerm}"` 
              : "Nenhum militar disponível"}
          </div>
        ) : (
          <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1.5 pt-1 pl-0.5" id="personnel-list">
            {filteredPersonnel.map((person) => (
              <div key={person.id} className="transform transition-transform duration-200 hover:-translate-y-1">
                <PersonnelCard personnel={person} />
              </div>
            ))}
          </div>
        )}
        
        {/* Contador de resultados */}
        <div className="mt-2 text-xs text-gray-500 text-right">
          {filteredPersonnel.length} {filteredPersonnel.length === 1 ? 'militar' : 'militares'} 
          {searchTerm && ` encontrado${filteredPersonnel.length !== 1 ? 's' : ''}`}
        </div>
      </div>
    </div>
  );
}
