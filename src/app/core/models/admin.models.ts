export interface DashboardStats {
  totalWorkers: number;
  activeWorkersToday: number;
  totalHoursThisWeek: number;
  estimatedWeeklyPayroll: number;
}

export interface Worker {
  id: number;
  fullName: string;
  email: string;
  hourlyRate: number;
  active: boolean;
  workLocationId: number | null;
  workLocationName: string;
}

// Interfaz para la petición de actualización
export interface UpdateWorkerRequest {
  fullName: string;
  hourlyRate: number;
  isActive: boolean;
}

export interface InviteRequest {
  email: string;
  hourlyRate: number;
}

export interface ConsolidatedPayrollEntry {
  workerId: number;
  workerName: string;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalHours: number;
  totalPay: number;
}

export interface ConsolidatedPayrollReport {
  startDate: string;
  endDate: string;
  entries: ConsolidatedPayrollEntry[];
  grandTotalPay: number;
}

export interface DailySummary {
  date: string;
  workLocationName: string;
  clockInTime: string;
  startLunchTime: string;
  endLunchTime: string;
  clockOutTime: string;
  totalHours: number;
  dailyRate: number;
  totalPay: number;
  clockInLogId: number | null;
  startLunchLogId: number | null;
  endLunchLogId: number | null;
  clockOutLogId: number | null;
}
export interface WeeklySummary {
  workWeek: { id: number; startDate: string; endDate: string; };
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  totalPay: number;
  status: 'OPEN' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'; 
}

import { TimeLog } from './timelog.models';
export interface DetailedPayrollReport {
  workerId: number;
  workerName: string;
  startDate: string;
  endDate: string;
  weeklySummaries: WeeklySummary[];
  dailySummariesByWeek: { [weekId: string]: DailySummary[] }; // <-- Propiedad que faltaba
  timeLogsByWeek: { [weekId: string]: TimeLog[] };           // <-- Propiedad para la edición
  grandTotalHours: number;
  grandTotalRegularHours: number;
  grandTotalOvertimeHours: number;
  grandTotalPay: number;
}