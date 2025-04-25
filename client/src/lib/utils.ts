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
  // Calcular qual guarnição está de serviço em qualquer data específica
  
  // Ordem de rotação definida: CHARLIE, BRAVO, ALFA
  const rotationOrder = ["CHARLIE", "BRAVO", "ALFA"];
  
  // Data de referência estabelecida: 1 de abril de 2025 (CHARLIE)
  const refDate = new Date(2025, 3, 1); // 1 de abril de 2025 (mês é 0-indexed)
  
  // Considerando que a troca de serviço ocorre nas quintas-feiras às 19h30
  // Primeiro identificamos qual é o dia da semana da data recebida
  const dayOfWeek = date.getDay(); // 0=domingo, 1=segunda, ..., 4=quinta, ...
  
  // Para datas normais, vamos calcular baseado na semana
  const dateCopy = new Date(date.getTime()); // Cópia para não modificar a original
  
  // Caso seja uma quinta-feira, vamos considerar como ainda sendo a guarnição 
  // que está no serviço antes das 19h30
  let dateToUse = dateCopy;
  
  // Calcular dias desde a data de referência (01/04/2025, quando CHARLIE está de serviço)
  const daysDiff = Math.floor((dateToUse.getTime() - refDate.getTime()) / (24 * 60 * 60 * 1000));
  
  // Calcular em qual semana estamos (cada semana é um ciclo)
  const weekNumber = Math.floor(daysDiff / 7);
  
  // Determinar qual guarnição está de serviço com base no ciclo de 3 semanas (3 guarnições)
  const garrisonIndex = weekNumber % 3;  
  
  // Se é quinta-feira (dia 4), precisamos verificar se a data da troca de guarnição
  // já foi ultrapassada ou não. Mas aqui sempre consideramos a guarnição que termina
  // o serviço às 19h30, pois isso é relevante para detectar conflitos.
  if (dayOfWeek === 4) {
    // Estamos em uma quinta-feira, então a guarnição atual é a que está largando o serviço
    // O trecho abaixo seria para diferenciar antes/depois das 19h30, mas sempre consideramos a guarnição
    // que está terminando o serviço para fins de detecção de conflito
    return rotationOrder[garrisonIndex];
  }
  
  // Para os outros dias da semana, usamos o cálculo padrão
  return rotationOrder[garrisonIndex];
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
