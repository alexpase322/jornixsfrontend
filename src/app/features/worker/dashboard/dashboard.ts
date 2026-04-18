import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeLogService } from '../../../core/services/time-log';
import { ClockInRequest, TimeLog } from '../../../core/models/timelog.models';
import { TimesheetService } from '../../../core/services/timesheet';

type WorkerStatus = 'Working' | 'On Lunch' | 'Out of Office' | 'Shift Finished';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  public weeklyLogs = signal<TimeLog[]>([]);
  public currentStatus = signal<WorkerStatus>('Out of Office');
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);
  private readonly deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  private readonly dateFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: this.deviceTimeZone,
  });
  private readonly timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: this.deviceTimeZone,
  });

  constructor(private timeLogService: TimeLogService, private timesheetService: TimesheetService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.timeLogService.getWeeklyLogs().subscribe({
      next: (logs) => {
        const normalizedLogs = this.sortLogsByTimestamp(logs ?? []);
        this.weeklyLogs.set(normalizedLogs);
        this.updateStatus(normalizedLogs);
      },
      error: (err) => this.handleError('Could not load time records.'),
    });
  }

  private updateStatus(logs: TimeLog[]): void {
    if (logs.length === 0) {
      this.currentStatus.set('Out of Office');
      return;
    }
    const lastLog = logs[logs.length - 1].eventType;
    switch (lastLog) {
      case 'INGRESO':
      case 'FINAL_ALMUERZO':
        this.currentStatus.set('Working');
        break;
      case 'INICIO_ALMUERZO':
        this.currentStatus.set('On Lunch');
        break;
      case 'SALIDA':
        this.currentStatus.set('Shift Finished');
        break;
      default:
        this.currentStatus.set('Out of Office');
    }
  }

  // --- Acciones del Usuario ---

  onClockIn(): void {
    if (!navigator.geolocation) {
      this.handleError('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: ClockInRequest = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        this.timeLogService.clockIn(coords).subscribe({
          next: () => this.loadLogs(),
          error: (err) => this.handleError(err.error?.message || 'Error clocking in.'),
        });
      },
      () => this.handleError('Could not get location. Make sure to grant permissions.')
    );
  }

  onStartLunch(): void {
    this.timeLogService.startLunch().subscribe({
      next: () => this.loadLogs(),
      error: (err) => this.handleError(err.error?.message || 'Error starting lunch.'),
    });
  }

  onEndLunch(): void {
    this.timeLogService.endLunch().subscribe({
      next: () => this.loadLogs(),
      error: (err) => this.handleError(err.error?.message || 'Error ending lunch.'),
    });
  }

  onClockOut(): void {
    this.timeLogService.clockOut().subscribe({
      next: () => this.loadLogs(),
      error: (err) => this.handleError(err.error?.message || 'Error clocking out.'),
    });
  }
  
  private handleError(message: string): void {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(null), 5000); // El error desaparece a los 5 segundos
  }

  private normalizeTimestamp(value: string): Date {
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    if (isDateOnly) {
      return new Date(`${value}T12:00:00`);
    }

    const isOnlyTime = /^\d{2}:\d{2}(:\d{2})?$/.test(value);
    if (isOnlyTime) {
      return new Date(`1970-01-01T${value}Z`);
    }

    const hasTimeZone = /(Z|[+-]\d{2}:\d{2})$/i.test(value);
    if (!hasTimeZone && value.includes('T')) {
      return new Date(`${value}Z`);
    }

    return new Date(value);
  }

  private sortLogsByTimestamp(logs: TimeLog[]): TimeLog[] {
    return [...logs].sort((a, b) => {
      const dateA = this.normalizeTimestamp(a.timestamp).getTime();
      const dateB = this.normalizeTimestamp(b.timestamp).getTime();

      if (Number.isNaN(dateA) || Number.isNaN(dateB)) {
        return 0;
      }

      return dateA - dateB;
    });
  }

  formatLogDate(timestamp: string | null | undefined): string {
    if (!timestamp) {
      return '--';
    }

    const parsed = this.normalizeTimestamp(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return '--';
    }

    return this.dateFormatter.format(parsed);
  }

  formatLogTime(timestamp: string | null | undefined): string {
    if (!timestamp) {
      return '--:--';
    }

    const parsed = this.normalizeTimestamp(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return '--:--';
    }

    return this.timeFormatter.format(parsed);
  }

  formatEventType(eventType: TimeLog['eventType'] | string | null | undefined): string {
    if (!eventType) {
      return 'NO EVENT';
    }
    // Map backend Spanish event types to English display labels.
    // Backend data is NOT modified — only the UI representation is translated.
    const translations: Record<string, string> = {
      'INGRESO': 'Clock In',
      'INICIO_ALMUERZO': 'Lunch Start',
      'FINAL_ALMUERZO': 'Lunch End',
      'SALIDA': 'Clock Out'
    };
    return translations[eventType] ?? eventType.replace('_', ' ');
  }

  submitWeek(): void {
    const logs = this.weeklyLogs();
    if (logs.length === 0) {
      this.handleError("No hours recorded to submit this week.");
      return;
    }
    
    // Obtenemos el ID de la semana del último registro
    const currentWeekId = logs[logs.length - 1]?.workWeekId;
    if (!currentWeekId) {
      this.handleError('Could not identify the current week to submit for approval.');
      return;
    }

    if (confirm('Are you sure you want to submit your hours for this week? Once submitted, you will not be able to modify them.')) {
        this.timesheetService.submitWeek(currentWeekId).subscribe({
            next: (message) => {
                this.successMessage.set(message);
                this.loadLogs(); // Recargamos para actualizar el estado
                setTimeout(() => this.successMessage.set(null), 3000);
            },
            error: (err) => this.handleError(err.error?.message || 'Error submitting timesheet.')
        });
    }
  }
}
