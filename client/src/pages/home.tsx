import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { OperationTabs } from "@/components/operation-tabs";
import { MonthNavigation } from "@/components/month-navigation";
import { PersonnelList } from "@/components/personnel-list";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { PersonnelModal } from "@/components/personnel-modal";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { getMonthDateRange, formatDateToISO } from "@/lib/utils";
import { Assignment, OperationType, Personnel } from "@shared/schema";

export default function Home() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
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
      {
        startDate: formatDateToISO(startDate),
        endDate: formatDateToISO(endDate)
      }
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
    refetchAssignments();
  };

  // Refresh assignments when month changes
  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["/api/assignments"]
    });
  }, [currentMonth, currentYear, queryClient]);

  return (
    <Layout>
      {/* Operation Tabs */}
      <OperationTabs
        activeOperation={activeOperation}
        onOperationChange={handleOperationChange}
      />

      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-6">
        <MonthNavigation
          currentDate={currentDate}
          onPreviousMonth={handlePreviousMonth}
          onCurrentMonth={handleCurrentMonth}
          onNextMonth={handleNextMonth}
          activeOperation={activeOperation}
        />
        
        <Button
          className="bg-[#4A6741] hover:bg-[#4A6741]/90 text-white"
          onClick={() => setIsPersonnelModalOpen(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
          Gerenciar Militares
        </Button>
      </div>

      {/* Calendar and Personnel List */}
      <div className="flex flex-col lg:flex-row gap-6">
        <PersonnelList personnel={personnel} />
        <ScheduleCalendar
          currentYear={currentYear}
          currentMonth={currentMonth}
          activeOperation={activeOperation}
          assignments={assignments}
          personnel={personnel}
          onAssignmentChange={handleAssignmentChange}
        />
      </div>

      {/* Personnel Management Modal */}
      <PersonnelModal
        isOpen={isPersonnelModalOpen}
        onClose={() => setIsPersonnelModalOpen(false)}
        personnel={personnel}
        onPersonnelChange={handlePersonnelChange}
      />
    </Layout>
  );
}
