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

// Shared Components & Pipes
import { FormatTimePipe } from '../../../shared/pipes/format-time-pipe';
import { TimeCorrectionModalComponent } from '../../../shared/time-correction-modal/time-correction-modal';

@Component({
  selector: 'app-detailed-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormatTimePipe,
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
  public isModalOpen = signal(false);
  public selectedLog = signal<TimeLog | null>(null);
  public dateForNewLog = signal<string | null>(null);

  constructor() {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(queryParams => {
      const { startDate, endDate } = queryParams;
      if (!startDate || !endDate) return;

      if (this.userRole() === 'ROLE_ADMINISTRADOR') {
        const workerId = this.route.snapshot.params['workerId'];
        if (workerId) this.loadAdminReport(workerId, startDate, endDate);
      } else if (this.userRole() === 'ROLE_TRABAJADOR') {
        this.loadWorkerReport(startDate, endDate);
      }
    });
  }

  loadAdminReport(workerId: number, startDate: string, endDate: string): void {
    this.adminService.generateDetailedReport(workerId, startDate, endDate).subscribe(data => {
      this.report.set(data);
    });
  }

  loadWorkerReport(startDate: string, endDate: string): void {
    this.timeLogService.getMyDetailedReport(startDate, endDate).subscribe(data => {
      this.report.set(data);
    });
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