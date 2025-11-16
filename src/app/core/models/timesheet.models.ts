export interface TimesheetSummary {
  timesheetId: number;
  workerId: number;
  workerName: string;
  workWeekId: number;
  weekStartDate: string;
  weekEndDate: string;
  status: 'OPEN' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null; // <-- Campo añadido
}