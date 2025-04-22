import React, { useState, useEffect } from 'react';
import { Personnel, Platoon, platoonEnum } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PersonnelManagementProps {
  personnel: Personnel[];
  onClose: () => void;
  onPersonnelChange: () => void;
}

export function PersonnelManagement({ 
  personnel, 
  onClose, 
  onPersonnelChange 
}: PersonnelManagementProps) {
  const [selectedPerson, setSelectedPerson] = useState<Personnel | null>(null);
  const [name, setName] = useState('');
  const [platoon, setPlatoon] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { toast } = useToast();

  // Reset form when changing selected person
  useEffect(() => {
    if (selectedPerson) {
      setName(selectedPerson.name || '');
      setPlatoon(selectedPerson.platoon || '');
    } else {
      resetForm();
    }
  }, [selectedPerson]);

  // Reset form fields
  const resetForm = () => {
    setName('');
    setPlatoon('');
    setIsEditing(false);
    setIsAdding(false);
  };

  // Handle form submission for adding or editing personnel
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isAdding) {
        // Creating new personnel
        await apiRequest('POST', '/api/personnel', {
          name,
          platoon: platoon || null,
          rank: determineBestRank(name) // Derive rank from name automatically
        });

        toast({
          title: "Sucesso",
          description: "Militar adicionado com sucesso",
        });
      } else if (isEditing && selectedPerson?.id) {
        // Updating existing personnel
        await apiRequest('PUT', `/api/personnel/${selectedPerson.id}`, {
          name,
          platoon: platoon || null,
          // Keep the existing rank
          rank: selectedPerson.rank
        });

        toast({
          title: "Sucesso",
          description: "Militar atualizado com sucesso",
        });
      }

      // Reset form and refresh data
      resetForm();
      setSelectedPerson(null);
      onPersonnelChange();
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/personnel'] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o militar",
        variant: "destructive"
      });
      console.error('Error saving personnel:', error);
    }
  };

  // Handle personnel deletion
  const handleDelete = async () => {
    if (!selectedPerson?.id) return;

    if (window.confirm(`Tem certeza que deseja excluir ${selectedPerson.name}?`)) {
      try {
        await apiRequest('DELETE', `/api/personnel/${selectedPerson.id}`);

        toast({
          title: "Sucesso",
          description: "Militar excluído com sucesso",
        });

        resetForm();
        setSelectedPerson(null);
        onPersonnelChange();
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/personnel'] });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao excluir o militar",
          variant: "destructive"
        });
        console.error('Error deleting personnel:', error);
      }
    }
  };

  // Function to determine rank based on name (preserves existing logic)
  const determineBestRank = (name: string): string => {
    const upperName = name.toUpperCase();
    
    if (upperName.includes('CAP')) return 'CAP';
    if (upperName.includes('TEN')) return 'TEN';
    if (upperName.includes('1SGT')) return '1SGT';
    if (upperName.includes('2SGT')) return '2SGT';
    if (upperName.includes('3SGT')) return '3SGT';
    if (upperName.includes('CB')) return 'CB';
    if (upperName.includes('SD')) return 'SD';
    
    return 'SD'; // Default rank
  };

  // Get background color based on garrison/platoon
  const getGuarnitionColor = (platoon?: string): string => {
    switch (platoon) {
      case "ALFA":
        return "bg-blue-700";
      case "BRAVO":
        return "bg-green-700";
      case "CHARLIE":
        return "bg-red-700";
      case "EXPEDIENTE":
        return "bg-purple-700";
      default:
        return "bg-gray-700";
    }
  };

  // Filter personnel based on search term
  const filteredPersonnel = personnel.filter(person => 
    person.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.platoon?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group personnel by platoon
  const groupedPersonnel = platoonEnum.options.reduce((acc, platoon) => {
    acc[platoon] = filteredPersonnel.filter(p => p.platoon === platoon);
    return acc;
  }, {} as Record<string, Personnel[]>);

  // Handle starting to add a new personnel
  const handleAddNew = () => {
    setSelectedPerson(null);
    resetForm();
    setIsAdding(true);
  };

  // Handle starting to edit a personnel
  const handleEdit = (person: Personnel) => {
    setSelectedPerson(person);
    setIsEditing(true);
    setIsAdding(false);
  };

  // Handle canceling the form
  const handleCancel = () => {
    resetForm();
    setSelectedPerson(null);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#1A3A5F] to-[#4A6741] flex items-center justify-center z-50 overflow-auto">
      <div className="bg-[#F8FAFC] rounded-xl shadow-2xl w-[90%] max-w-5xl max-h-[90vh] overflow-auto">
        <div className="relative p-6">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1A3A5F] to-[#4A6741] bg-clip-text text-transparent mb-2">
            Gerenciar Militares
          </h1>
          
          <p className="text-gray-600 text-lg mb-8">
            20ª CIPM - Adicione, edite ou remova militares do sistema
          </p>
          
          {/* Action buttons */}
          <div className="mb-6 flex gap-4">
            <Button 
              onClick={handleAddNew}
              className="bg-[#1A3A5F] hover:bg-[#12283F]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Adicionar Militar
            </Button>
            
            <div className="relative flex-1">
              <Input
                placeholder="Buscar por nome ou guarnição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Container for form and personnel list */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Form Section */}
            <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                {isAdding ? 'Adicionar Novo Militar' : isEditing ? 'Editar Militar' : 'Detalhes do Militar'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Name input */}
                  <div>
                    <Label htmlFor="name" className="text-base">Nome</Label>
                    <Input
                      id="name"
                      placeholder="Ex: CB PM SILVA"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isAdding && !isEditing}
                      className="mt-1"
                    />
                  </div>
                  
                  {/* Platoon selection */}
                  <div>
                    <Label htmlFor="platoon" className="text-base">Guarnição</Label>
                    <Select 
                      value={platoon} 
                      onValueChange={setPlatoon}
                      disabled={!isAdding && !isEditing}
                    >
                      <SelectTrigger id="platoon" className="mt-1">
                        <SelectValue placeholder="Selecione a guarnição" />
                      </SelectTrigger>
                      <SelectContent>
                        {platoonEnum.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Action buttons */}
                  {(isAdding || isEditing) && (
                    <div className="flex gap-4 pt-4">
                      <Button 
                        type="submit" 
                        className="bg-[#1A3A5F] hover:bg-[#12283F] flex-1"
                      >
                        {isAdding ? 'Adicionar' : 'Salvar'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCancel}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                  
                  {/* Edit and Delete buttons */}
                  {selectedPerson && !isEditing && !isAdding && (
                    <div className="flex gap-4 pt-4">
                      <Button 
                        type="button" 
                        className="bg-[#1A3A5F] hover:bg-[#12283F] flex-1"
                        onClick={() => setIsEditing(true)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </Button>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        onClick={handleDelete}
                        className="flex-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Excluir
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            </div>
            
            {/* Personnel List */}
            <div className="w-full lg:w-2/3 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                Militares Cadastrados
              </h2>
              
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                {/* Render each platoon section */}
                {Object.entries(groupedPersonnel).map(([platoonName, platoonPersonnel]) => (
                  platoonPersonnel.length > 0 && (
                    <div key={platoonName} className="space-y-2">
                      <h3 className="font-semibold text-lg text-gray-700 mb-2 flex items-center">
                        <span className={`w-3 h-3 rounded-full ${getGuarnitionColor(platoonName)} mr-2`}></span>
                        Guarnição {platoonName} ({platoonPersonnel.length})
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {platoonPersonnel.map((person) => (
                          <div
                            key={person.id}
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedPerson?.id === person.id
                                ? "border-[#1A3A5F] bg-[#F0F7FF] shadow-md"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => setSelectedPerson(person)}
                          >
                            <div className={`${getGuarnitionColor(person.platoon)} text-white w-10 h-10 rounded-full flex items-center justify-center mr-3 shadow-sm`}>
                              <span className="font-bold text-xs">{person.rank}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{person.name}</p>
                              <span className="text-sm text-gray-500">{person.platoon || "Sem Guarnição"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
                
                {/* Show message if no personnel found */}
                {filteredPersonnel.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-xl font-medium">Nenhum militar encontrado</p>
                    <p className="mt-1">Tente mudar os termos da busca ou adicione novos militares</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}