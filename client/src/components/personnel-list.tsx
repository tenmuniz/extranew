import { Personnel } from "@shared/schema";
import { PersonnelCard } from "@/components/ui/personnel-card";

interface PersonnelListProps {
  personnel: Personnel[];
}

export function PersonnelList({ personnel }: PersonnelListProps) {
  return (
    <div className="lg:w-1/4">
      <div className="bg-white rounded-lg shadow-md p-4 border border-[#E7EBF0]">
        <h3 className="font-heading font-bold text-xl text-[#1A3A5F] mb-4 flex items-center border-b pb-3">
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
        
        {personnel.length === 0 ? (
          <div className="p-4 text-center text-gray-500 border border-dashed rounded-lg">
            Nenhum militar disponível
          </div>
        ) : (
          <div className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto pr-1" id="personnel-list">
            {personnel.map((person) => (
              <PersonnelCard key={person.id} personnel={person} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
