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
  // REGRAS ESPECÍFICAS conforme mostrado na imagem de exemplo:
  // - Dias 01-07: GU CHARLIE (semana completa)
  // - Dias 08-14: GU BRAVO (semana completa)
  // - Dias 15-21: GU ALFA (semana completa)
  // - Dias 22-28: GU CHARLIE (semana completa)
  // - Dias 29-30: GU BRAVO (semana completa)
  // E assim por diante em ciclos de 3 semanas
  
  // Obter apenas a data (dia)
  const day = date.getDate();
  
  // Verificamos em qual semana do mês estamos
  // baseado apenas no dia do mês
  if (day >= 1 && day <= 7) {
    return "CHARLIE";
  } else if (day >= 8 && day <= 14) {
    return "BRAVO";
  } else if (day >= 15 && day <= 21) {
    return "ALFA";
  } else if (day >= 22 && day <= 28) {
    return "CHARLIE";
  } else if (day >= 29) {
    return "BRAVO";
  }
  
  // Não deve chegar até aqui, mas por segurança:
  return "CHARLIE";
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
  
  // A função getActiveGuarnitionForDay já foi corrigida para retornar corretamente
  // a guarnição de serviço em qualquer data, incluindo quintas-feiras
  const activeGuarnition = getActiveGuarnitionForDay(date);
  
  // Verificar se o militar pertence à guarnição que está de serviço
  const isInService = personnel.platoon === activeGuarnition;
  
  // Se for quinta-feira e o militar pertencer à guarnição que está de serviço neste dia,
  // e for escalado para operação que começa ANTES do final do serviço (19h30),
  // consideramos um conflito pois o militar ainda estará em serviço no horário da operação
  if (isThursday && isInService) {
    console.log(`CONFLITO QUINTA-FEIRA: Militar da guarnição ${personnel.platoon} - Guarnição de serviço: ${activeGuarnition} - Data: ${date.toLocaleDateString()}`);
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