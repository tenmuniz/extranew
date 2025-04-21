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
  // Implementação baseada na troca às quintas-feiras
  // Para calcular qual guarnição está de serviço, precisamos saber:
  // 1. A referência de início (qual guarnição iniciou o ano)
  // 2. Contar o número de semanas completas (trocas) desde essa data

  // Definindo uma data de referência onde ALFA estava de serviço
  // 04/01/2025 ALFA estava de serviço (primeiro ciclo do ano)
  const referenceDate = new Date(2025, 0, 4); // 4 de Janeiro de 2025
  const referenceGuarnition = "ALFA";

  // Ordem de rotação das guarnições
  const rotationOrder = ["ALFA", "BRAVO", "CHARLIE"];
  
  // Calculamos quantas mudanças de quinta-feira aconteceram entre a data de referência e a data solicitada
  // Cada quinta-feira é uma troca de guarnição
  let targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  // Encontrar a quinta-feira mais recente ou a mesma data se for quinta
  const dayOfWeek = targetDate.getDay(); // 0 = domingo, 4 = quinta
  let daysToLastThursday = dayOfWeek >= 4 ? dayOfWeek - 4 : dayOfWeek + 3;
  
  // Subtrair dias para chegar à quinta-feira mais recente
  const lastThursday = new Date(targetDate);
  lastThursday.setDate(targetDate.getDate() - daysToLastThursday);
  
  // Calcular o número de semanas entre a data de referência e a quinta-feira mais recente
  const weeksDiff = Math.floor((lastThursday.getTime() - referenceDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  
  // Determinar qual guarnição está de serviço com base na rotação
  const rotationIndex = weeksDiff % 3;
  let currentIndex = rotationOrder.indexOf(referenceGuarnition);
  currentIndex = (currentIndex + rotationIndex) % 3;
  
  return rotationOrder[currentIndex];
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
