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
  // CORREÇÃO DOS DIAS ESPECÍFICOS:
  // - Dias 01-02: CHARLIE
  // - Dia 03 em diante (após a troca): BRAVO (até o dia 09)
  // - Dia 10 em diante (após a troca): ALFA (até o dia 16)
  // - Dia 17 em diante (após a troca): CHARLIE (até o dia 23)
  // E assim por diante - com trocas toda quinta-feira
  
  // Datas específicas de abril/2025
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  
  // Verificação específica para abril/2025 baseada na informação fornecida
  if (year === 2025 && month === 3) { // Abril é mês 3 (zero-indexado)
    if (day >= 1 && day <= 2) {
      return "CHARLIE"; // Dias 1-2 de abril: CHARLIE
    } else if (day >= 3 && day <= 9) {
      return "BRAVO";   // Dias 3-9 de abril: BRAVO
    } else if (day >= 10 && day <= 16) {
      return "ALFA";    // Dias 10-16 de abril: ALFA
    } else if (day >= 17 && day <= 23) {
      return "CHARLIE"; // Dias 17-23 de abril: CHARLIE
    } else if (day >= 24 && day <= 30) {
      return "BRAVO";   // Dias 24-30 de abril: BRAVO
    }
  }
  
  // Para outras datas, calculamos com base nas quintas-feiras
  // Referência: dia 03/04/2025 (quinta-feira) - BRAVO assume o serviço
  const firstThursday = new Date(2025, 3, 3); // 03/04/2025
  
  // Ordem de rotação após cada quinta-feira
  const rotationOrder = ["BRAVO", "ALFA", "CHARLIE"];
  
  // Encontrar a última quinta-feira antes ou igual à data fornecida
  const dateCopy = new Date(date);
  const dayOfWeek = dateCopy.getDay(); // 0 = domingo, 4 = quinta
  
  // Se não estivermos em uma quinta, recuamos para a quinta-feira anterior
  const daysToLastThursday = dayOfWeek >= 4 ? dayOfWeek - 4 : dayOfWeek + 3;
  dateCopy.setDate(dateCopy.getDate() - daysToLastThursday);
  
  // Calcular quantas semanas (de quinta a quinta) desde a primeira referência
  const weeksDiff = Math.floor((dateCopy.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  
  // Índice da guarnição atual no ciclo de rotação (garantindo que nunca seja negativo)
  const rotationIndex = ((weeksDiff % 3) + 3) % 3;
  
  // Retornar a guarnição baseada no índice de rotação
  return rotationOrder[rotationIndex];
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
  
  // Importante: nas quintas-feiras, precisamos verificar qual guarnição está deixando o serviço
  // pois o conflito ocorre quando o militar ainda está em serviço (antes da troca às 19h30)
  // e é escalado para uma operação que começa antes das 19:30
  
  // Para detectar conflitos nas quintas, precisamos saber qual guarnição estava
  // de serviço ANTES da troca que ocorre às 19:30
  
  // Dia específico: 03/04/2025 (quinta) - CHARLIE está em serviço ANTES da troca
  if (date.getFullYear() === 2025 && date.getMonth() === 3 && date.getDate() === 3) {
    const guarnicaoAntesDaTroca = "CHARLIE";
    const isInService = personnel.platoon === guarnicaoAntesDaTroca;
    
    if (isInService) {
      console.log(`CONFLITO QUINTA-FEIRA DETECTADO: 
        Militar: Guarnição ${personnel.platoon}
        Data: 03/04/2025 (Quinta-feira)
        Operação: ${operationType}
        Motivo: Militar ainda está em serviço até 19h30, mas operação começa antes`);
      return true;
    }
    return false;
  }
  
  // Dia específico: 10/04/2025 (quinta) - BRAVO está em serviço ANTES da troca
  if (date.getFullYear() === 2025 && date.getMonth() === 3 && date.getDate() === 10) {
    const guarnicaoAntesDaTroca = "BRAVO";
    const isInService = personnel.platoon === guarnicaoAntesDaTroca;
    
    if (isInService) {
      console.log(`CONFLITO QUINTA-FEIRA DETECTADO: 
        Militar: Guarnição ${personnel.platoon}
        Data: 10/04/2025 (Quinta-feira)
        Operação: ${operationType}
        Motivo: Militar ainda está em serviço até 19h30, mas operação começa antes`);
      return true;
    }
    return false;
  }
  
  // Dia específico: 17/04/2025 (quinta) - ALFA está em serviço ANTES da troca
  if (date.getFullYear() === 2025 && date.getMonth() === 3 && date.getDate() === 17) {
    const guarnicaoAntesDaTroca = "ALFA";
    const isInService = personnel.platoon === guarnicaoAntesDaTroca;
    
    if (isInService) {
      console.log(`CONFLITO QUINTA-FEIRA DETECTADO: 
        Militar: Guarnição ${personnel.platoon}
        Data: 17/04/2025 (Quinta-feira)
        Operação: ${operationType}
        Motivo: Militar ainda está em serviço até 19h30, mas operação começa antes`);
      return true;
    }
    return false;
  }
  
  // Dia específico: 24/04/2025 (quinta) - CHARLIE está em serviço ANTES da troca
  if (date.getFullYear() === 2025 && date.getMonth() === 3 && date.getDate() === 24) {
    const guarnicaoAntesDaTroca = "CHARLIE";
    const isInService = personnel.platoon === guarnicaoAntesDaTroca;
    
    if (isInService) {
      console.log(`CONFLITO QUINTA-FEIRA DETECTADO: 
        Militar: Guarnição ${personnel.platoon}
        Data: 24/04/2025 (Quinta-feira)
        Operação: ${operationType}
        Motivo: Militar ainda está em serviço até 19h30, mas operação começa antes`);
      return true;
    }
    return false;
  }
  
  // Para outras quintas-feiras, precisamos encontrar qual guarnição está de serviço
  // seguindo o padrão de rotação de 3 semanas
  
  // Em outras quintas-feiras, encontrar a guarnição que está deixando o serviço
  // (que é a guarnição anterior à que assume às 19:31)
  
  // Referência: dia 03/04/2025 (quinta-feira) - CHARLIE está de serviço antes da troca
  const primeiraQuinta = new Date(2025, 3, 3); // 03/04/2025
  
  // Ordem de rotação ANTES da troca em cada quinta-feira
  const rotationOrderBeforeChange = ["CHARLIE", "BRAVO", "ALFA"];
  
  // Calcular o número de semanas desde a primeira quinta-feira
  const weeksSince = Math.round((date.getTime() - primeiraQuinta.getTime()) / (7 * 24 * 60 * 60 * 1000));
  
  // Calcular qual guarnição está em serviço antes da troca
  const rotationIndex = ((weeksSince % 3) + 3) % 3;
  const guarnicaoAntesTraca = rotationOrderBeforeChange[rotationIndex];
  
  // Verificar se o militar pertence à guarnição que está de serviço
  const isInService = personnel.platoon === guarnicaoAntesTraca;
  
  if (isInService) {
    console.log(`CONFLITO QUINTA-FEIRA DETECTADO: 
      Militar: Guarnição ${personnel.platoon}
      Guarnição de serviço antes da troca: ${guarnicaoAntesTraca}
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