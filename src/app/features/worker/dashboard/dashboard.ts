import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeLogService } from '../../../core/services/time-log';
import { ClockInRequest, TimeLog } from '../../../core/models/timelog.models';
import { TimesheetService } from '../../../core/services/timesheet';

type WorkerStatus = 'Trabajando' | 'En Almuerzo' | 'Fuera de Oficina' | 'Jornada Finalizada';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  public weeklyLogs = signal<TimeLog[]>([]);
  public currentStatus = signal<WorkerStatus>('Fuera de Oficina');
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  constructor(private timeLogService: TimeLogService, private timesheetService: TimesheetService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.timeLogService.getWeeklyLogs().subscribe({
      next: (logs) => {
        this.weeklyLogs.set(logs);
        this.updateStatus(logs);
      },
      error: (err) => this.handleError('No se pudieron cargar los registros.'),
    });
  }

  private updateStatus(logs: TimeLog[]): void {
    if (logs.length === 0) {
      this.currentStatus.set('Fuera de Oficina');
      return;
    }
    const lastLog = logs[logs.length - 1].eventType;
    switch (lastLog) {
      case 'INGRESO':
      case 'FINAL_ALMUERZO':
        this.currentStatus.set('Trabajando');
        break;
      case 'INICIO_ALMUERZO':
        this.currentStatus.set('En Almuerzo');
        break;
      case 'SALIDA':
        this.currentStatus.set('Jornada Finalizada');
        break;
      default:
        this.currentStatus.set('Fuera de Oficina');
    }
  }

  // --- Acciones del Usuario ---

  onClockIn(): void {
    if (!navigator.geolocation) {
      this.handleError('La geolocalización no es compatible con este navegador.');
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
          error: (err) => this.handleError(err.error.message || 'Error al marcar ingreso.'),
        });
      },
      () => this.handleError('No se pudo obtener la ubicación. Asegúrate de dar los permisos.')
    );
  }

  onStartLunch(): void {
    this.timeLogService.startLunch().subscribe({
      next: () => this.loadLogs(),
      error: (err) => this.handleError('Error al iniciar almuerzo.'),
    });
  }

  onEndLunch(): void {
    this.timeLogService.endLunch().subscribe({
      next: () => this.loadLogs(),
      error: (err) => this.handleError('Error al finalizar almuerzo.'),
    });
  }

  onClockOut(): void {
    this.timeLogService.clockOut().subscribe({
      next: () => this.loadLogs(),
      error: (err) => this.handleError('Error al marcar salida.'),
    });
  }
  
  private handleError(message: string): void {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(null), 5000); // El error desaparece a los 5 segundos
  }

  submitWeek(): void {
    const logs = this.weeklyLogs();
    if (logs.length === 0) {
      this.handleError("No hay horas registradas para enviar esta semana.");
      return;
    }
    
    // Obtenemos el ID de la semana del último registro
    const currentWeekId = logs[logs.length - 1].workWeekId;

    if (confirm('¿Estás seguro de que quieres enviar tus horas de esta semana? Una vez enviadas, no podrás modificarlas.')) {
        this.timesheetService.submitWeek(currentWeekId).subscribe({
            next: (message) => {
                this.successMessage.set(message);
                this.loadLogs(); // Recargamos para actualizar el estado
                setTimeout(() => this.successMessage.set(null), 3000);
            },
            error: (err) => this.handleError(err.error?.message || 'Error al enviar la hoja de horas.')
        });
    }
  }
}