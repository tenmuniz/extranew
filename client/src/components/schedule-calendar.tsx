import { useState, useEffect } from "react";
import { CalendarDay } from "@/components/ui/calendar-day";
import { PersonnelCard } from "@/components/ui/personnel-card";
import { 
  getFirstDayOfMonth, 
  getLastDayOfMonth, 
  isWeekday, 
  formatDateToISO,
  isPersonnelInService,
  getActiveGuarnitionForDay,
  getGarrisonColor
} from "@/lib/utils";
import { Assignment, OperationType, Personnel } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ScheduleCalendarProps {
  currentYear: number;
  currentMonth: number; // 0-indexed (0 = January, 11 = December)
  activeOperation: OperationType;
  assignments: Assignment[];
  personnel: Personnel[];
  onAssignmentChange: () => void;
}

export function ScheduleCalendar({
  currentYear,
  currentMonth,
  activeOperation,
  assignments,
  personnel,
  onAssignmentChange
}: ScheduleCalendarProps) {
  const { toast } = useToast();
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  // Generate calendar days for the current month (apenas os dias do mês atual)
  useEffect(() => {
    const days: Date[] = [];
    const lastDate = getLastDayOfMonth(currentYear, currentMonth);
    
    // Adicionar apenas os dias do mês atual (do dia 1 até o último)
    for (let i = 1; i <= lastDate; i++) {
      const day = new Date(currentYear, currentMonth, i);
      days.push(day);
    }
    
    setCalendarDays(days);
  }, [currentYear, currentMonth]);

  // Handle dropping a personnel on a calendar day
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, date: Date) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;

    try {
      const personnelData = JSON.parse(data);
      const dateStr = formatDateToISO(date);
      
      // Check if date is valid for the current operation
      if (activeOperation === "ESCOLA" && !isWeekday(date)) {
        toast({
          title: "Operação não permitida",
          description: "Não é possível escalar na Operação Escola Segura aos finais de semana",
          variant: "destructive"
        });
        return;
      }
      
      // Verificar se o militar está na guarnição que está em serviço (não bloqueamos, apenas alertamos)
      // Buscar dados do militar
      const militarSelecionado = personnel.find(p => p.id === personnelData.id);
      if (militarSelecionado && militarSelecionado.platoon && militarSelecionado.platoon !== "EXPEDIENTE") {
        // Verificar se está em serviço baseado na escala 7x14
        if (isPersonnelInService(militarSelecionado, date)) {
          toast({
            title: "Atenção: Militar em Serviço",
            description: `O militar da guarnição ${militarSelecionado.platoon} está em período de serviço. Confirme se deseja escalá-lo mesmo assim.`,
            variant: "default"
          });
          // Não retornamos, permitimos continuar
        }
      }
      
      // Verificar se o militar já atingiu o limite de 12 extras
      if (militarSelecionado && (militarSelecionado.extras || 0) >= 12) {
        // Criar um elemento de alerta personalizado para melhor visualização
        const alertEl = document.createElement('div');
        alertEl.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        alertEl.innerHTML = `
          <div class="bg-white rounded-lg shadow-xl max-w-md w-11/12 overflow-hidden animate-in zoom-in-90 duration-300 transform">
            <div class="bg-red-600 p-4 flex items-center">
              <svg class="w-8 h-8 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <h2 class="text-white text-xl font-bold">Limite de Extras Atingido</h2>
            </div>
            <div class="p-5">
              <p class="mb-4 text-gray-700">
                <strong>${militarSelecionado.name}</strong> já atingiu o limite máximo de 12 extras e não pode ser escalado novamente.
              </p>
              <div class="flex justify-end">
                <button id="close-alert" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium">Entendi</button>
              </div>
            </div>
          </div>
        `;
        
        document.body.appendChild(alertEl);
        
        document.getElementById('close-alert')?.addEventListener('click', () => {
          alertEl.classList.add('fade-out');
          setTimeout(() => {
            if (document.body.contains(alertEl)) {
              document.body.removeChild(alertEl);
            }
          }, 300);
        });
        
        return;
      }
      
      // Verificar se o militar já está escalado neste dia (em qualquer operação)
      const existingAssignments = getAssignmentsForDate(date);
      const alreadyAssigned = existingAssignments.some(
        assignment => assignment.personnelId === personnelData.id
      );
      
      if (alreadyAssigned) {
        // Criar um elemento de alerta personalizado com animação
        const alertEl = document.createElement('div');
        alertEl.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        alertEl.innerHTML = `
          <div class="bg-white rounded-lg shadow-xl max-w-md w-11/12 overflow-hidden animate-in zoom-in-90 duration-300 transform">
            <div class="bg-amber-500 p-4 flex items-center">
              <svg class="w-8 h-8 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h2 class="text-white text-xl font-bold">Militar Já Escalado</h2>
            </div>
            <div class="p-5">
              <p class="mb-4 text-gray-700">
                <strong>${militarSelecionado?.name}</strong> já está escalado neste dia. Cada militar só pode ser escalado uma vez por dia.
              </p>
              <div class="flex justify-end">
                <button id="close-alert" class="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors font-medium">Entendi</button>
              </div>
            </div>
          </div>
        `;
        
        document.body.appendChild(alertEl);
        
        document.getElementById('close-alert')?.addEventListener('click', () => {
          alertEl.classList.add('fade-out');
          setTimeout(() => {
            if (document.body.contains(alertEl)) {
              document.body.removeChild(alertEl);
            }
          }, 300);
        });
        
        return;
      }
      
      // Verificar limites de militares por operação
      const maxPersonnel = activeOperation === "PMF" ? 3 : 2;
      if (existingAssignments.length >= maxPersonnel) {
        toast({
          title: "Limite excedido",
          description: `Não é possível escalar mais de ${maxPersonnel} militares nesta operação por dia`,
          variant: "destructive"
        });
        return;
      }
      
      // Incrementar extras do militar (usando a referência do militar que já buscamos anteriormente)
      if (militarSelecionado) {
        // Atualizar extras do militar
        await apiRequest("PUT", `/api/personnel/${personnelData.id}`, {
          ...militarSelecionado,
          extras: (militarSelecionado.extras || 0) + 1
        });
      }
      
      // Send assignment request to the server
      const response = await apiRequest("POST", "/api/assignments", {
        personnelId: personnelData.id,
        operationType: activeOperation,
        date: dateStr
      });
      
      if (response.ok) {
        // Refresh assignments and personnel (para atualizar o número de extras)
        onAssignmentChange();
        
        toast({
          title: "Militar escalado",
          description: `${personnelData.name} escalado com sucesso para ${date.toLocaleDateString('pt-BR')}`,
        });
      }
    } catch (error) {
      console.error("Error assigning personnel:", error);
      toast({
        title: "Erro ao escalar militar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  // Handle removing an assignment - versão melhorada
  const handleRemoveAssignment = async (assignmentId: number, personnelName: string) => {
    try {
      // Primeiro, obtenha a designação para saber qual militar está sendo removido
      const assignment = assignments.find(a => a.id === assignmentId);
      
      if (!assignment) {
        console.log(`Designação com ID ${assignmentId} não encontrada no estado local`);
        onAssignmentChange(); // Atualizar a UI para garantir consistência
        return;
      }
      
      // Encontrar o militar para decrementar extras
      const selectedPersonnel = personnel.find(p => p.id === assignment.personnelId);
      
      // Executamos as duas operações em sequência
      let personnelUpdated = false;
      let assignmentDeleted = false;
      
      // 1. Primeiro atualizamos o militar (decrementar extras)
      if (selectedPersonnel && selectedPersonnel.extras > 0) {
        try {
          const personnelResponse = await apiRequest("PUT", `/api/personnel/${selectedPersonnel.id}`, {
            ...selectedPersonnel,
            extras: selectedPersonnel.extras - 1
          });
          
          if (personnelResponse.ok) {
            personnelUpdated = true;
            console.log(`Militar ${selectedPersonnel.id} atualizado com sucesso`);
          }
        } catch (updateError) {
          console.error(`Erro ao atualizar extras do militar: ${updateError}`);
        }
      }
      
      // 2. Depois tentamos remover a designação
      try {
        const response = await apiRequest("DELETE", `/api/assignments/${assignmentId}`);
        
        if (response.ok) {
          assignmentDeleted = true;
          console.log(`Designação ${assignmentId} removida com sucesso`);
        }
      } catch (deleteError) {
        console.error(`Erro ao excluir designação: ${deleteError}`);
      }
      
      // Mesmo que apenas uma das operações tenha sido bem-sucedida, atualizamos a UI
      if (personnelUpdated || assignmentDeleted) {
        // Garantimos que a UI seja atualizada
        onAssignmentChange();
        
        // Notificamos o usuário
        toast({
          title: "Militar removido",
          description: `${personnelName} removido da escala com sucesso`,
        });
      } else {
        // Se nenhuma operação foi bem-sucedida, ainda atualizamos a UI, mas mostramos um erro
        onAssignmentChange();
        
        toast({
          title: "Atenção",
          description: "Houve um problema ao remover o militar, mas a interface foi atualizada",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao remover designação:", error);
      
      // Mesmo com erro, atualizamos a UI para garantir consistência
      onAssignmentChange();
      
      toast({
        title: "Erro ao remover militar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  // Get personnel data from assignment
  const getPersonnelFromAssignment = (assignment: Assignment): Personnel | undefined => {
    return personnel.find(p => p.id === assignment.personnelId);
  };

  // Get assignments for a specific date (para qualquer mês)
  const getAssignmentsForDate = (date: Date): Assignment[] => {
    const dateStr = formatDateToISO(date);
    
    const filteredAssignments = assignments.filter(a => {
      const assignmentDateStr = formatDateToISO(new Date(a.date));
      return assignmentDateStr === dateStr && a.operationType === activeOperation;
    });
    
    return filteredAssignments;
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Check if a date is in the current month
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  };

  // Check if a day should be disabled based on operation type
  const isDayDisabled = (date: Date): boolean => {
    // Desabilitar dias não úteis para operação Escola Segura
    return activeOperation === "ESCOLA" && !isWeekday(date);
  };



  return (
    <div className="w-full lg:w-3/4">
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">        
        {/* Título do mês e ano */}
        <div className="text-center font-bold text-lg sm:text-xl text-[#1A3A5F] p-2 mb-4 border-b-2 border-[#1A3A5F]/20">
          Escalas para {new Date(currentYear, currentMonth, 1).toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'}).charAt(0).toUpperCase() + new Date(currentYear, currentMonth, 1).toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'}).slice(1)}
        </div>
        
        {/* Calendar grid - responsivo para mobile e desktop */}
        <div id="calendar-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 auto-rows-fr gap-2">
          {/* Dias do mês - começando sempre no primeiro card */}
          {calendarDays.map((day, index) => {
            const dayAssignments = getAssignmentsForDate(day);
            const disabled = isDayDisabled(day);
            
            // Contar quantos militares estão na data atual para a operação ativa
            const filteredAssignments = dayAssignments.filter(
              assignment => assignment.operationType === activeOperation
            );
            
            return (
              <CalendarDay
                key={index}
                date={day}
                isCurrentMonth={isCurrentMonth(day)}
                isDisabled={disabled}
                onDragOver={handleDragOver as React.DragEventHandler<HTMLDivElement>}
                onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, day)}
                activeOperation={activeOperation}
                assignmentsCount={filteredAssignments.length}
              >
                {dayAssignments.map((assignment) => {
                  const person = getPersonnelFromAssignment(assignment);
                  if (!person) return null;
                  
                  return (
                    <PersonnelCard
                      key={assignment.id}
                      personnel={person}
                      isAssigned={true}
                      isDraggable={false}
                      onRemove={() => handleRemoveAssignment(assignment.id, person.name)}
                    />
                  );
                })}
              </CalendarDay>
            );
          })}
        </div>
      </div>
    </div>
  );
}
