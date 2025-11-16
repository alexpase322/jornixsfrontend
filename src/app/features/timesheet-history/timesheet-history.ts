import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TimesheetService } from '../../core/services/timesheet'; 
import { TimesheetSummary } from '../../core/models/timesheet.models';
import { AuthService } from '../../core/services/auth'; 
import { AdminService } from '../../core/services/admin'; 
import { Worker } from '../../core/models/admin.models';

@Component({
  selector: 'app-timesheet-history',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './timesheet-history.html',
})
export class TimesheetHistoryComponent implements OnInit {
  private authService = inject(AuthService);
  public userRole = this.authService.userRole;

  filterForm: FormGroup;
  timesheets = signal<TimesheetSummary[]>([]);
  workers = signal<Worker[]>([]); // Para el filtro del admin

  statuses = ['OPEN', 'SUBMITTED', 'APPROVED', 'REJECTED'];

  constructor(
    private fb: FormBuilder,
    private timesheetService: TimesheetService,
    private adminService: AdminService
  ) {
    this.filterForm = this.fb.group({
      workerId: [null],
      status: ['']
    });
  }

  ngOnInit(): void {
    if (this.userRole() === 'ROLE_ADMINISTRADOR') {
      this.adminService.getWorkers('ALL').subscribe(data => this.workers.set(data));
    }
    this.loadTimesheets();

    this.filterForm.valueChanges.subscribe(() => this.loadTimesheets());
  }

  loadTimesheets(): void {
    const { status, workerId } = this.filterForm.value;
    this.timesheetService.getFilteredTimesheets(status || undefined, workerId || undefined)
      .subscribe(data => this.timesheets.set(data));
  }

  resubmit(timesheetId: number): void {
    if (confirm('¿Estás seguro de que quieres reabrir esta hoja de horas para editarla?')) {
      this.timesheetService.resubmitTimesheet(timesheetId).subscribe(() => this.loadTimesheets());
    }
  }
}