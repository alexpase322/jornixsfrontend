import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // Importar Router y RouterModule
import { AdminService } from '../../../core/services/admin';
import { DashboardStats, ConsolidatedPayrollReport } from '../../../core/models/admin.models';

// --- IMPORTACIONES CORRECTAS PARA NG2-CHARTS ---
import { BaseChartDirective } from 'ng2-charts'; 
import { ChartConfiguration, ChartData } from 'chart.js';

// --- Importaciones para la nueva funcionalidad ---
import { TimesheetService } from '../../../core/services/timesheet';
import { TimesheetSummary } from '../../../core/models/timesheet.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective],
  templateUrl: './dashboard.html',
})
export class AdminDashboardComponent implements OnInit {
  // Inyección de servicios
  private adminService = inject(AdminService);
  private timesheetService = inject(TimesheetService);
  private router = inject(Router);

  // Señales para los datos
  public stats = signal<DashboardStats | null>(null);
  public isLoadingStats = signal(true);
  public dashboardError = signal<string | null>(null);

  // --- SEÑALES NUEVAS PARA ACCIONES PENDIENTES ---
  public pendingTimesheets = signal<TimesheetSummary[]>([]);
  public pendingCount = computed(() => this.pendingTimesheets().length);

  // --- Configuración para Chart.js (ng2-charts) ---
  public barChartData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [
      { 
        data: [], 
        label: 'Horas Trabajadas',
        backgroundColor: 'rgba(139, 92, 246, 0.8)', // Color violeta
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  });

  public barChartOptions = signal<ChartConfiguration['options']>({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: '#9CA3AF' } },
      y: { ticks: { color: '#9CA3AF' }, beginAtZero: true }
    },
    plugins: { legend: { display: false } }
  });
  // --- Fin de la configuración ---

  constructor() {}

  ngOnInit(): void {
    this.loadStats();
    this.loadChartData();
    this.loadPendingTimesheets();
  }

  private loadStats(): void {
    this.isLoadingStats.set(true);
    this.dashboardError.set(null);

    this.adminService.getDashboardStats().subscribe({
      next: data => {
        this.stats.set(data);
        this.isLoadingStats.set(false);
      },
      error: () => {
        this.dashboardError.set('No se pudo cargar la información del dashboard.');
        this.isLoadingStats.set(false);
      }
    });
  }

  loadChartData(): void {
    const { startDate, endDate } = this.getCurrentWeekRange();
    this.adminService.generateConsolidatedReport(startDate, endDate).subscribe({
      next: report => {
        const labels: string[] = [];
        const data: number[] = [];
        report.entries.filter(e => e.totalHours > 0).forEach(entry => {
          labels.push(entry.workerName);
          data.push(entry.totalHours);
        });
        this.barChartData.set({
          labels: labels,
          datasets: [{ ...this.barChartData().datasets[0], data: data }]
        });
      },
      error: () => {
        this.barChartData.set({
          labels: [],
          datasets: [{ ...this.barChartData().datasets[0], data: [] }]
        });
      }
    });
  }

  private formatDateToLocalISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatWeekDate(value: string): string {
    if (!value) {
      return '--';
    }

    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const parsed = new Date(isDateOnly ? `${value}T12:00:00` : value);
    if (Number.isNaN(parsed.getTime())) {
      return '--';
    }

    return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  loadPendingTimesheets(): void {
    this.timesheetService.getSubmittedTimesheets().subscribe({
      next: data => {
        this.pendingTimesheets.set(data);
      },
      error: () => {
        this.pendingTimesheets.set([]);
      }
    });
  }

  goToApprovals(): void {
    this.router.navigate(['/admin/approvals']);
  }

  private getCurrentWeekRange(): { startDate: string, endDate: string } {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return {
      startDate: this.formatDateToLocalISO(startOfWeek),
      endDate: this.formatDateToLocalISO(endOfWeek)
    };
  }
}
