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

  // Generate calendar days for the current month
  useEffect(() => {
    const days: Date[] = [];
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const lastDate = getLastDayOfMonth(currentYear, currentMonth);
    
    // Add days from previous month to fill the first row
    const prevMonthLastDate = getLastDayOfMonth(
      currentMonth === 0 ? currentYear - 1 : currentYear,
      currentMonth === 0 ? 11 : currentMonth - 1
    );
    
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = new Date(
        currentMonth === 0 ? currentYear - 1 : currentYear,
        currentMonth === 0 ? 11 : currentMonth - 1,
        prevMonthLastDate - i
      );
      days.push(day);
    }
    
    // Add days from current month
    for (let i = 1; i <= lastDate; i++) {
      const day = new Date(currentYear, currentMonth, i);
      days.push(day);
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows x 7 columns = 42 cells
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(
        currentMonth === 11 ? currentYear + 1 : currentYear,
        currentMonth === 11 ? 0 : currentMonth + 1,
        i
      );
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
      
      // Verificar se o militar já está escalado neste dia e operação
      const existingAssignments = getAssignmentsForDate(date);
      const alreadyAssigned = existingAssignments.some(
        assignment => assignment.personnelId === personnelData.id
      );
      
      if (alreadyAssigned) {
        toast({
          title: "Militar já escalado",
          description: "Este militar já está escalado neste dia para esta operação",
          variant: "destructive"
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

  // Handle removing an assignment
  const handleRemoveAssignment = async (assignmentId: number, personnelName: string) => {
    try {
      // Primeiro, obtenha a designação para saber qual militar está sendo removido
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) {
        throw new Error("Designação não encontrada");
      }
      
      // Encontrar o militar para decrementar extras
      const selectedPersonnel = personnel.find(p => p.id === assignment.personnelId);
      if (selectedPersonnel && selectedPersonnel.extras > 0) {
        // Atualizar extras do militar (decrementar)
        await apiRequest("PUT", `/api/personnel/${selectedPersonnel.id}`, {
          ...selectedPersonnel,
          extras: selectedPersonnel.extras - 1
        });
      }
      
      // Remover a designação
      const response = await apiRequest("DELETE", `/api/assignments/${assignmentId}`);
      
      if (response.ok) {
        // Refresh assignments and personnel (para atualizar o número de extras)
        onAssignmentChange();
        
        toast({
          title: "Militar removido",
          description: `${personnelName} removido da escala com sucesso`,
        });
      }
    } catch (error) {
      console.error("Error removing assignment:", error);
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

  // Get assignments for a specific date (only for the current month)
  const getAssignmentsForDate = (date: Date): Assignment[] => {
    // Se não for do mês atual, não mostra nenhuma atribuição
    if (!isCurrentMonth(date)) {
      return [];
    }
    
    const dateStr = formatDateToISO(date);
    return assignments.filter(
      a => formatDateToISO(new Date(a.date)) === dateStr && a.operationType === activeOperation
    );
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

  // Check if a day should be disabled based on operation type and month
  const isDayDisabled = (date: Date): boolean => {
    // Desabilitar dias que não são do mês atual
    if (!isCurrentMonth(date)) {
      return true;
    }
    
    // Desabilitar dias não úteis para operação Escola Segura
    return activeOperation === "ESCOLA" && !isWeekday(date);
  };



  return (
    <div className="lg:w-3/4">
      <div className="bg-white rounded-lg shadow-md p-4">        
        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          <div className="text-center font-bold text-[#1A3A5F] p-2 border-b-2 border-[#1A3A5F]/20">Dom</div>
          <div className="text-center font-bold text-[#1A3A5F] p-2 border-b-2 border-[#1A3A5F]/20">Seg</div>
          <div className="text-center font-bold text-[#1A3A5F] p-2 border-b-2 border-[#1A3A5F]/20">Ter</div>
          <div className="text-center font-bold text-[#1A3A5F] p-2 border-b-2 border-[#1A3A5F]/20">Qua</div>
          <div className="text-center font-bold text-[#1A3A5F] p-2 border-b-2 border-[#1A3A5F]/20">Qui</div>
          <div className="text-center font-bold text-[#1A3A5F] p-2 border-b-2 border-[#1A3A5F]/20">Sex</div>
          <div className="text-center font-bold text-[#1A3A5F] p-2 border-b-2 border-[#1A3A5F]/20">Sáb</div>
        </div>
        
        {/* Calendar grid */}
        <div id="calendar-grid" className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const dayAssignments = getAssignmentsForDate(day);
            const disabled = isDayDisabled(day);
            
            return (
              <CalendarDay
                key={index}
                date={day}
                isCurrentMonth={isCurrentMonth(day)}
                isDisabled={disabled}
                onDragOver={handleDragOver as React.DragEventHandler<HTMLDivElement>}
                onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, day)}
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
