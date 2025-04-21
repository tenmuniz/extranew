import { Personnel } from "@shared/schema";
import { PersonnelCard } from "@/components/ui/personnel-card";

interface PersonnelListProps {
  personnel: Personnel[];
}

export function PersonnelList({ personnel }: PersonnelListProps) {
  return (
    <div className="lg:w-1/4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-heading font-bold text-lg text-[#1A3A5F] mb-3 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          Militares Disponíveis
        </h3>
        <div className="space-y-3" id="personnel-list">
          {personnel.map((person) => (
            <PersonnelCard key={person.id} personnel={person} />
          ))}
        </div>
      </div>
    </div>
  );
}
