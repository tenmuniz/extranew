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

  // Garantir que estamos usando a data correta sem problemas de fuso horário
  // Criar uma nova data apenas com ano, mês e dia para evitar problemas de horas
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const cleanDate = new Date(year, month, day, 12, 0, 0); // Meio-dia para evitar problemas de DST
  
  // Definindo uma data de referência onde CHARLIE estava de serviço
  // 04/01/2025 agora CHARLIE está de serviço (primeiro ciclo do ano na nova ordem)
  const referenceDate = new Date(2025, 0, 4, 12, 0, 0); // 4 de Janeiro de 2025, meio-dia
  const referenceGuarnition = "CHARLIE";

  // Ordem de rotação das guarnições (nova ordem: CHARLIE, BRAVO, ALFA)
  const rotationOrder = ["CHARLIE", "BRAVO", "ALFA"];
  
  // Encontrar a quinta-feira mais recente ou a mesma data se for quinta
  const dayOfWeek = cleanDate.getDay(); // 0 = domingo, 4 = quinta
  let daysToLastThursday = dayOfWeek >= 4 ? dayOfWeek - 4 : dayOfWeek + 3;
  
  // Subtrair dias para chegar à quinta-feira mais recente
  const lastThursday = new Date(cleanDate);
  lastThursday.setDate(cleanDate.getDate() - daysToLastThursday);
  
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

// Function to check if personnel has Thursday service conflict with operations
// Conflito ocorre quando um militar termina serviço na quinta às 19h30, mas está 
// escalado para operação PMF (17h30) ou Escola Segura (18h00) no mesmo dia
export function hasThursdayServiceConflict(personnel: {platoon?: string}, date: Date, operationType: string): boolean {
  // Se não tem pelotão ou é expediente, não tem conflito
  if (!personnel.platoon || personnel.platoon === "EXPEDIENTE") {
    return false;
  }
  
  // Verificamos se é quinta-feira
  const isThursday = date.getDay() === 4; // 4 é quinta-feira
  
  // Verificamos se o pelotão do militar é o que está de serviço NESTE dia
  // (não o que está entrando, mas o que está atualmente de serviço e vai largar às 19h30)
  const activeGuarnition = getActiveGuarnitionForDay(date);
  const isInService = personnel.platoon === activeGuarnition;
  
  // Se é quinta-feira e o militar está no pelotão que está de serviço hoje
  // (portanto só larga às 19h30), temos um conflito com PMF (17h30) ou Escola Segura (18h00)
  return isThursday && isInService;
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
