import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

// Services
import { AdminService } from '../../../core/services/admin';
import { AuthService } from '../../../core/services/auth';
import { TimeLogService } from '../../../core/services/time-log';

// Models
import { DetailedPayrollReport, DailySummary } from '../../../core/models/admin.models';
import { TimeLog } from '../../../core/models/timelog.models';

// Shared Components
import { TimeCorrectionModalComponent } from '../../../shared/time-correction-modal/time-correction-modal';

@Component({
  selector: 'app-detailed-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TimeCorrectionModalComponent
  ],
  templateUrl: './detailed-report.html',
})
export class DetailedReportComponent implements OnInit {
  // Inyección de servicios
  private authService = inject(AuthService);
  private adminService = inject(AdminService);
  private timeLogService = inject(TimeLogService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  // Señales para manejar el estado
  public userRole = this.authService.userRole;
  public report = signal<DetailedPayrollReport | null>(null);
  public isLoading = signal(false);
  public loadError = signal<string | null>(null);
  public isModalOpen = signal(false);
  public selectedLog = signal<TimeLog | null>(null);
  public dateForNewLog = signal<string | null>(null);
  private readonly deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  private readonly longDateFormatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: this.deviceTimeZone
  });
  private readonly weekDateFormatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    timeZone: this.deviceTimeZone
  });
  private readonly dailyDateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    timeZone: this.deviceTimeZone
  });
  private readonly timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: this.deviceTimeZone
  });

  constructor() {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(queryParams => {
      let startDate = queryParams['startDate'];
      let endDate = queryParams['endDate'];

      // Fallback: si no se pasan fechas, usar semana actual
      if (!startDate || !endDate) {
        const range = this.getCurrentWeekRange();
        startDate = range.startDate;
        endDate = range.endDate;
      }

      if (this.userRole() === 'ROLE_ADMINISTRADOR') {
        const workerId = this.route.snapshot.params['workerId'];
        if (workerId) this.loadAdminReport(workerId, startDate, endDate);
      } else if (this.userRole() === 'ROLE_TRABAJADOR') {
        this.loadWorkerReport(startDate, endDate);
      }
    });
  }

  private getCurrentWeekRange(): { startDate: string; endDate: string } {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { startDate: fmt(start), endDate: fmt(end) };
  }

  loadAdminReport(workerId: number, startDate: string, endDate: string): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.adminService.generateDetailedReport(workerId, startDate, endDate).subscribe({
      next: data => {
        this.report.set(data);
        this.isLoading.set(false);
      },
      error: err => {
        this.loadError.set(err?.error?.message || 'Error loading the report.');
        this.isLoading.set(false);
      }
    });
  }

  loadWorkerReport(startDate: string, endDate: string): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.timeLogService.getMyDetailedReport(startDate, endDate).subscribe({
      next: data => {
        this.report.set(data);
        this.isLoading.set(false);
      },
      error: err => {
        this.loadError.set(err?.error?.message || 'Error loading the report.');
        this.isLoading.set(false);
      }
    });
  }

  private normalizeTimestamp(value: string): Date {
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    if (isDateOnly) {
      // Evita desfases de día al convertir fechas sin hora.
      return new Date(`${value}T12:00:00`);
    }

    const hasTimeZone = /(Z|[+-]\d{2}:\d{2})$/i.test(value);
    if (!hasTimeZone && value.includes('T')) {
      return new Date(`${value}Z`);
    }

    return new Date(value);
  }

  private normalizeTimeValue(value: string | null): Date | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    // Acepta HH:MM, HH:MM:SS, y HH:MM:SS.xxxxxx (con microsegundos del backend Java LocalTime)
    const timeMatch = value.match(/^(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/);
    if (timeMatch) {
      const [, hours, minutes, seconds] = timeMatch;
      return new Date(
        1970, 0, 1,
        parseInt(hours, 10),
        parseInt(minutes, 10),
        seconds ? parseInt(seconds, 10) : 0
      );
    }

    return this.normalizeTimestamp(value);
  }

  formatLongDate(value: string): string {
    return this.longDateFormatter.format(this.normalizeTimestamp(value));
  }

  formatWeekDate(value: string): string {
    return this.weekDateFormatter.format(this.normalizeTimestamp(value));
  }

  formatDailyDate(value: string): string {
    return this.dailyDateFormatter.format(this.normalizeTimestamp(value));
  }

  formatEventTime(value: string | null): string {
    const parsed = this.normalizeTimeValue(value);
    if (!parsed || Number.isNaN(parsed.getTime())) {
      return '--:--';
    }

    return this.timeFormatter.format(parsed);
  }

  goBack(): void {
    this.location.back();
  }

  // --- Lógica para manejar el Modal de Corrección ---

  openCorrectionModal(daily: DailySummary, eventType: 'INGRESO' | 'INICIO_ALMUERZO' | 'FINAL_ALMUERZO' | 'SALIDA', weekId: number): void {
    let logData: Partial<TimeLog> = { eventType, workWeekId: weekId };
    let logId: number | null = null;
    let timestamp: string | null = null;

    // Buscamos el ID y la hora del evento específico en el que se hizo clic
    switch (eventType) {
      case 'INGRESO':
        logId = daily.clockInLogId;
        timestamp = daily.clockInTime;
        break;
      case 'INICIO_ALMUERZO':
        logId = daily.startLunchLogId;
        timestamp = daily.startLunchTime;
        break;
      case 'FINAL_ALMUERZO':
        logId = daily.endLunchLogId;
        timestamp = daily.endLunchTime;
        break;
      case 'SALIDA':
        logId = daily.clockOutLogId;
        timestamp = daily.clockOutTime;
        break;
    }

    if (logId) {
      // Si el log existe (tiene un ID), abrimos el modal en modo EDICIÓN
      this.selectedLog.set({ id: logId, eventType, timestamp, workWeekId: weekId } as TimeLog);
      this.dateForNewLog.set(null);
    } else {
      // Si el log no existe (ID es nulo), abrimos el modal en modo AÑADIR
      this.selectedLog.set(null);
      this.dateForNewLog.set(daily.date); // Pasamos la fecha del día
    }

    this.isModalOpen.set(true);
  }

  openAddModal(date: string): void {
    this.selectedLog.set(null);
    this.dateForNewLog.set(date);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedLog.set(null);
    this.dateForNewLog.set(null);
  }

  onSaveCorrection(): void {
    this.closeModal();
    // Recarga el reporte para ver los cambios
    if (this.userRole() === 'ROLE_ADMINISTRADOR') {
        const workerId = this.route.snapshot.params['workerId'];
        const { startDate, endDate } = this.route.snapshot.queryParams;
        this.loadAdminReport(workerId, startDate, endDate);
    } else {
        const { startDate, endDate } = this.route.snapshot.queryParams;
        this.loadWorkerReport(startDate, endDate);
    }
  }
}
