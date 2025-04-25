import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to get the last day of a month
export function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Function to get the first day of the month (0 = Sunday, 1 = Monday, etc.)
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// Function to format a date as "YYYY-MM-DD"
export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Function to format a date to display as "Month Year" (e.g., "September 2023")
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

// Function to capitalize the first letter of a string
export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// Function to get a date range for a specific month
export function getMonthDateRange(year: number, month: number): { startDate: Date, endDate: Date } {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  return { startDate, endDate };
}

// Function to check if a date is a weekday (Monday-Friday)
export function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day > 0 && day < 6; // 0 is Sunday, 6 is Saturday
}

// Function to get day of week abbreviation in Portuguese
export function getDayOfWeekAbbr(date: Date): string {
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return dayNames[date.getDay()];
}

// Function to get the color class based on the day of the week
export function getDayColorClass(date: Date): string {
  const day = date.getDay();
  if (day === 0) return 'bg-navy'; // Sunday
  if (day === 6) return 'bg-slate'; // Saturday
  return 'bg-militaryGreen'; // Weekday
}

// Function to determine which garrison (guarnição) is on service on a given date
export function getActiveGuarnitionForDay(date: Date): string {
  // REGRA SIMPLES: Toda quinta-feira troca a guarnição
  // Ordem de rotação: CHARLIE -> BRAVO -> ALFA -> CHARLIE...
  
  // Vamos usar a imagem de referência para verificar que:
  // - Em 03/04/2025 (quinta-feira) a guarnição é CHARLIE
  // - Em 10/04/2025 (quinta-feira) a guarnição é BRAVO
  // - Em 17/04/2025 (quinta-feira) a guarnição é ALFA
  
  // Referência para quinta-feira 03/04/2025: CHARLIE
  const referenceDate = new Date(2025, 3, 3); // 03/04/2025
  const referenceGuarnition = "CHARLIE";
  
  // Sequência de rotação
  const rotationOrder = ["CHARLIE", "BRAVO", "ALFA"];
  
  // Calcular o número de quintas-feiras entre a data de referência e a data fornecida
  
  // 1. Encontrar a quinta-feira mais próxima (anterior ou a própria data) para a data fornecida
  const dayOfWeek = date.getDay(); // 0 = domingo, 4 = quinta
  const daysToLastThursday = dayOfWeek >= 4 ? dayOfWeek - 4 : dayOfWeek + 3;
  const dateThursday = new Date(date.getTime() - daysToLastThursday * 24 * 60 * 60 * 1000);
  
  // 2. Calcular o número de semanas entre a quinta-feira de referência e a quinta-feira da data
  const weeksDiff = Math.round((dateThursday.getTime() - referenceDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  
  // 3. Calcular qual guarnição está ativa baseado no ciclo de rotação
  const indexInRotation = ((weeksDiff % 3) + 3) % 3; // +3 e %3 para evitar índices negativos
  
  // Retornar a guarnição correspondente ao índice de rotação
  return rotationOrder[indexInRotation];
}

// Function to check if personnel is available for an assignment on a given date
export function isPersonnelAvailable(personnel: {platoon?: string}, date: Date): boolean {
  // If the personnel has no platoon or is EXPEDIENTE, they're always available
  if (!personnel.platoon || personnel.platoon === "EXPEDIENTE") {
    return true;
  }
  
  // Conforme solicitado, não vamos bloquear o militar que está em serviço
  // Apenas retornaremos true para todos, porque a validação visual será feita no componente
  return true;
}

// Function to check if personnel is in service on a given date
export function isPersonnelInService(personnel: {platoon?: string}, date: Date): boolean {
  // If the personnel has no platoon or is EXPEDIENTE, they're never in service
  if (!personnel.platoon || personnel.platoon === "EXPEDIENTE") {
    return false;
  }
  
  // Check if personnel's platoon is on service on the given date
  const activeGuarnition = getActiveGuarnitionForDay(date);
  return personnel.platoon === activeGuarnition;
}

// Function to check if personnel has Thursday service conflict with operations
// Conflito ocorre quando um militar está em serviço na quinta até às 19h30, mas está 
// escalado para operação PMF (17h30) ou Escola Segura (18h00) no mesmo dia
export function hasThursdayServiceConflict(personnel: {platoon?: string}, date: Date, operationType: string): boolean {
  // Se não tem pelotão ou é expediente, não tem conflito
  if (!personnel.platoon || personnel.platoon === "EXPEDIENTE") {
    return false;
  }
  
  // Verificamos se é quinta-feira
  const isThursday = date.getDay() === 4; // 4 é quinta-feira
  if (!isThursday) return false; // Se não for quinta, não tem esse tipo de conflito
  
  // Importante: nas quintas-feiras, verificamos qual guarnição está de serviço antes da troca
  // que ocorre às 19:30, pois o conflito ocorre quando o militar ainda está em serviço
  // mas é escalado para uma operação que começa antes das 19:30
  
  // Usando a mesma referência do getActiveGuarnitionForDay
  const referenceDate = new Date(2025, 3, 3); // 03/04/2025 - CHARLIE
  const rotationOrder = ["CHARLIE", "BRAVO", "ALFA"];
  
  // Encontrar a quinta-feira atual (que é a data fornecida, já que já verificamos que é quinta)
  const dateThursday = new Date(date);
  
  // Calcular o número de semanas entre a quinta-feira de referência e a quinta-feira atual
  const weeksDiff = Math.round((dateThursday.getTime() - referenceDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  
  // Calcular qual guarnição está de serviço nesta quinta-feira
  const indexInRotation = ((weeksDiff % 3) + 3) % 3;
  const activeGuarnition = rotationOrder[indexInRotation];
  
  // Verificar se o militar pertence à guarnição que está de serviço nesta quinta-feira
  const isInService = personnel.platoon === activeGuarnition;
  
  // Se for quinta-feira e o militar pertencer à guarnição que está de serviço neste dia,
  // e for escalado para operação que começa ANTES do final do serviço (19h30),
  // consideramos um conflito pois o militar ainda estará em serviço no horário da operação
  if (isInService) {
    // Adicionamos logs detalhados para diagnóstico
    console.log(`CONFLITO QUINTA-FEIRA DETECTADO: 
      Militar: Guarnição ${personnel.platoon}
      Guarnição de serviço atual: ${activeGuarnition}
      Data: ${date.toLocaleDateString('pt-BR')} (Quinta-feira)
      Operação: ${operationType}
      Motivo: Militar ainda está em serviço até 19h30, mas operação começa antes`);
    return true;
  }
  
  return false;
}

// Function to get background color based on garrison
export function getGarrisonColor(platoon?: string): string {
  if (!platoon) return "#6B7280"; // Default gray
  
  switch (platoon) {
    case "ALFA":
      return "#1A3A5F"; // Navy blue
    case "BRAVO":
      return "#4A6741"; // Military green
    case "CHARLIE":
      return "#8B0000"; // Dark red
    default:
      return "#6B7280"; // Default gray for EXPEDIENTE
  }
}