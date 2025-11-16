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
    this.adminService.getDashboardStats().subscribe(data => this.stats.set(data));
    this.loadChartData();
    this.loadPendingTimesheets();
  }

  loadChartData(): void {
    const { startDate, endDate } = this.getCurrentWeekRange();
    this.adminService.generateConsolidatedReport(startDate, endDate).subscribe(report => {
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
    });
  }

  loadPendingTimesheets(): void {
    this.timesheetService.getSubmittedTimesheets().subscribe(data => {
      this.pendingTimesheets.set(data);
    });
  }

  goToApprovals(): void {
    this.router.navigate(['/admin/approvals']);
  }

  private getCurrentWeekRange(): { startDate: string, endDate: string } {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(today.setDate(today.getDate() + diffToMonday));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return {
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0]
    };
  }
}
