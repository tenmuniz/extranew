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
