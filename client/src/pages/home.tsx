import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { OperationTabs } from "@/components/operation-tabs";
import { MonthNavigation } from "@/components/month-navigation";
import { PersonnelList } from "@/components/personnel-list";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { PersonnelManagement } from "@/components/personnel-management";
import { NewReportModal } from "@/components/new-report-modal";
import { ConflictsDashboard } from "@/components/conflicts-dashboard";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { getMonthDateRange, formatDateToISO } from "@/lib/utils";
import { Assignment, OperationType, Personnel } from "@shared/schema";

// Mapa de ordem de patentes (para ordenação hierárquica)
const rankOrder: Record<string, number> = {
  "CAP": 1,    // Capitão (mais alto)
  "1TEN": 2,   // 1º Tenente 
  "TEN": 3,    // Tenente
  "SUBTEN": 4, // Sub-Tenente
  "1SGT": 5,   // 1º Sargento
  "2SGT": 6,   // 2º Sargento
  "3SGT": 7,   // 3º Sargento
  "CB": 8,     // Cabo
  "SD": 9      // Soldado (mais baixo)
};

export default function Home() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  const [isConflictsDashboardOpen, setIsConflictsDashboardOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeOperation, setActiveOperation] = useState<OperationType>("PMF");

  // Calculate current month/year from the date
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get date range for the current month
  const { startDate, endDate } = getMonthDateRange(currentYear, currentMonth);

  // Fetch personnel
  const {
    data: personnel = [],
    isLoading: isLoadingPersonnel,
    refetch: refetchPersonnel
  } = useQuery<Personnel[]>({
    queryKey: ["/api/personnel"],
  });

  // Fetch assignments for the current month
  const {
    data: assignments = [],
    isLoading: isLoadingAssignments,
    refetch: refetchAssignments
  } = useQuery<Assignment[]>({
    queryKey: [
      "/api/assignments",
      // Remover a restrição por data para obter todas as designações
    ],
  });

  // Handle month navigation
  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Handle operation change
  const handleOperationChange = (operation: OperationType) => {
    setActiveOperation(operation);
  };

  // Handle refresh of personnel or assignments
  const handlePersonnelChange = () => {
    refetchPersonnel();
  };

  const handleAssignmentChange = () => {
    // Ao alterar designações, também precisamos atualizar a lista de pessoal
    // para refletir as mudanças nos extras
    refetchAssignments();
    refetchPersonnel();
  };

  // Refresh assignments when month changes
  useEffect(() => {
    // Invalidar a consulta para buscar apenas os dados do novo mês
    queryClient.invalidateQueries({
      queryKey: ["/api/assignments"]
    });
  }, [currentMonth, currentYear, queryClient]);
  
  // Ordenar a lista de pessoal por patente (hierarquia militar)
  const sortedPersonnel = useMemo(() => {
    if (!personnel.length) return [];
    
    return [...personnel].sort((a, b) => {
      // Primeiro por patente (hierarquia)
      const rankDiff = (rankOrder[a.rank] || 999) - (rankOrder[b.rank] || 999);
      if (rankDiff !== 0) return rankDiff;
      
      // Depois por número de extras (menor para maior)
      return (a.extras || 0) - (b.extras || 0);
    });
  }, [personnel]);

  return (
    <Layout>
      {/* Operation Tabs */}
      <OperationTabs
        activeOperation={activeOperation}
        onOperationChange={handleOperationChange}
      />

      {/* Month Navigation */}
      <div className="flex flex-col mb-6">
        <MonthNavigation
          currentDate={currentDate}
          onPreviousMonth={handlePreviousMonth}
          onCurrentMonth={handleCurrentMonth}
          onNextMonth={handleNextMonth}
          activeOperation={activeOperation}
        />
        
        <div className="flex flex-wrap justify-center md:justify-end gap-4 mt-4">
          <Button
            className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] shadow-lg group transition-all hover:shadow-xl py-6 border-0 text-base font-semibold flex-1 md:flex-none"
            onClick={() => setIsConflictsDashboardOpen(true)}
          >
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-lg mr-3 group-hover:bg-white/30 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="text-left">
                <span className="opacity-80 text-sm block">Verificar</span>
                <span className="font-bold">Dashboard de Conflitos</span>
              </div>
            </div>
          </Button>
          
          <Button
            className="bg-gradient-to-r from-[#1A3A5F] to-[#3066BE] shadow-lg group transition-all hover:shadow-xl py-6 border-0 text-base font-semibold flex-1 md:flex-none"
            onClick={() => setIsReportModalOpen(true)}
          >
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-lg mr-3 group-hover:bg-white/30 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <span className="opacity-80 text-sm block">Gerar</span>
                <span className="font-bold">Relatório de Operações</span>
              </div>
            </div>
          </Button>
          
          <Button
            className="bg-gradient-to-r from-[#4A6741] to-[#6BA368] shadow-lg group transition-all hover:shadow-xl py-6 border-0 text-base font-semibold flex-1 md:flex-none"
            onClick={() => setIsPersonnelModalOpen(true)}
          >
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-lg mr-3 group-hover:bg-white/30 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-left">
                <span className="opacity-80 text-sm block">Administrar</span>
                <span className="font-bold">Gerenciar Militares</span>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Calendar and Personnel List */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-1/5 lg:flex-shrink-0">
          <PersonnelList personnel={sortedPersonnel} />
        </div>
        <div className="lg:w-4/5">
          <ScheduleCalendar
            currentYear={currentYear}
            currentMonth={currentMonth}
            activeOperation={activeOperation}
            assignments={assignments}
            personnel={sortedPersonnel}
            onAssignmentChange={handleAssignmentChange}
          />
        </div>
      </div>

      {/* Personnel Management Modal */}
      {isPersonnelModalOpen && (
        <PersonnelManagement
          personnel={sortedPersonnel}
          onClose={() => setIsPersonnelModalOpen(false)}
          onPersonnelChange={handlePersonnelChange}
        />
      )}

      {/* Dashboard de Conflitos */}
      {isConflictsDashboardOpen && (
        <ConflictsDashboard
          personnel={sortedPersonnel}
          assignments={assignments}
          currentMonth={currentMonth}
          currentYear={currentYear}
          onClose={() => setIsConflictsDashboardOpen(false)}
        />
      )}

      {/* Relatório de Operações */}
      {isReportModalOpen && (
        <NewReportModal
          personnel={sortedPersonnel}
          assignments={assignments}
          currentMonth={currentMonth}
          currentYear={currentYear}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </Layout>
  );
}
