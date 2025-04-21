import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Personnel, rankEnum } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const personnelFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  rank: rankEnum,
  extras: z.number().default(0),
});

type PersonnelFormValues = z.infer<typeof personnelFormSchema>;

interface PersonnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnel: Personnel[];
  onPersonnelChange: () => void;
}

export function PersonnelModal({ isOpen, onClose, personnel, onPersonnelChange }: PersonnelModalProps) {
  const { toast } = useToast();
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);

  const form = useForm<PersonnelFormValues>({
    resolver: zodResolver(personnelFormSchema),
    defaultValues: {
      name: "",
      rank: "SD",
      extras: 0,
    },
  });

  const resetForm = () => {
    form.reset({
      name: "",
      rank: "SD",
      extras: 0,
    });
    setEditingPersonnel(null);
  };

  // Handle form submission (add or edit personnel)
  const onSubmit = async (data: PersonnelFormValues) => {
    try {
      let response;
      
      if (editingPersonnel) {
        // Edit existing personnel
        response = await apiRequest("PUT", `/api/personnel/${editingPersonnel.id}`, data);
        
        if (response.ok) {
          toast({
            title: "Sucesso",
            description: `${data.name} atualizado com sucesso`,
          });
        }
      } else {
        // Add new personnel
        response = await apiRequest("POST", "/api/personnel", data);
        
        if (response.ok) {
          toast({
            title: "Sucesso",
            description: `${data.name} adicionado com sucesso`,
          });
        }
      }
      
      // Refresh personnel list
      onPersonnelChange();
      resetForm();
    } catch (error) {
      console.error("Error saving personnel:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  // Load personnel data for editing
  const handleEditPersonnel = (person: Personnel) => {
    setEditingPersonnel(person);
    form.reset({
      name: person.name,
      rank: person.rank as any,
      extras: person.extras,
    });
  };

  // Delete personnel
  const handleDeletePersonnel = async (person: Personnel) => {
    try {
      const response = await apiRequest("DELETE", `/api/personnel/${person.id}`);
      
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `${person.name} removido com sucesso`,
        });
        
        // Refresh personnel list
        onPersonnelChange();
      }
    } catch (error) {
      console.error("Error deleting personnel:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  // Handle dialog close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Get rank full name
  const getRankFullName = (rank: string) => {
    const rankMap: Record<string, string> = {
      SD: "Soldado",
      CB: "Cabo",
      "3SGT": "3º Sargento",
      "2SGT": "2º Sargento",
      "1SGT": "1º Sargento",
      SUBTEN: "Sub-Tenente",
      TEN: "Tenente",
      "1TEN": "1º Tenente",
      CAP: "Capitão",
    };
    return rankMap[rank] || rank;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-xl text-[#1A3A5F]">
            Gerenciar Militares
          </DialogTitle>
          <DialogDescription>
            Adicione, edite ou remova militares do sistema de escala.
          </DialogDescription>
        </DialogHeader>

        {/* Add/Edit Personnel Form */}
        <div className="mb-4">
          <h3 className="font-medium text-[#1A3A5F] mb-2">
            {editingPersonnel ? "Editar Militar" : "Adicionar Novo Militar"}
          </h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patente</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a patente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SD">Soldado</SelectItem>
                          <SelectItem value="CB">Cabo</SelectItem>
                          <SelectItem value="SG">Sargento</SelectItem>
                          <SelectItem value="TN">Tenente</SelectItem>
                          <SelectItem value="CP">Capitão</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registro</FormLabel>
                      <FormControl>
                        <Input placeholder="Número de registro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                className="bg-[#4A6741] hover:bg-[#4A6741]/90 text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                {editingPersonnel ? "Atualizar Militar" : "Adicionar Militar"}
              </Button>
              {editingPersonnel && (
                <Button
                  type="button"
                  className="ml-2 bg-gray-500 hover:bg-gray-600 text-white"
                  onClick={resetForm}
                >
                  Cancelar Edição
                </Button>
              )}
            </form>
          </Form>
        </div>

        {/* Personnel List */}
        <div>
          <h3 className="font-medium text-[#1A3A5F] mb-2">Militares Cadastrados</h3>
          <div className="border border-[#708090]/20 rounded divide-y">
            {personnel.length === 0 ? (
              <div className="p-3 text-center text-gray-500">
                Nenhum militar cadastrado
              </div>
            ) : (
              personnel.map((person) => (
                <div
                  key={person.id}
                  className="p-3 flex items-center justify-between"
                  data-id={person.id}
                >
                  <div className="flex items-center">
                    <div className="bg-[#1A3A5F] text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">
                      <span className="font-medium text-sm">{person.rank}</span>
                    </div>
                    <div>
                      <p className="font-medium">{person.name}</p>
                      <p className="text-xs text-[#708090]">
                        Registro: {person.registrationNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="bg-[#708090] hover:bg-[#708090]/90 text-white p-1 rounded"
                      onClick={() => handleEditPersonnel(person)}
                      aria-label="Editar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      className="bg-[#960018] hover:bg-[#960018]/90 text-white p-1 rounded"
                      onClick={() => handleDeletePersonnel(person)}
                      aria-label="Excluir"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
