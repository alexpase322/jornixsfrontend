import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TimesheetService } from '../../../core/services/timesheet'; 
import { TimesheetSummary } from '../../../core/models/timesheet.models';

@Component({
  selector: 'app-timesheet-approval',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './timesheet-approval.html',
})
export class TimesheetApprovalComponent implements OnInit {
  public timesheets = signal<TimesheetSummary[]>([]);

  constructor(private timesheetService: TimesheetService) {}

  ngOnInit(): void { this.loadTimesheets(); }

  loadTimesheets(): void {
    this.timesheetService.getSubmittedTimesheets().subscribe(data => this.timesheets.set(data));
  }

  approve(id: number): void {
    this.timesheetService.approveTimesheet(id).subscribe(() => this.loadTimesheets());
  }

  reject(id: number): void {
    const reason = prompt('Por favor, introduce el motivo del rechazo:');
    if (reason) {
      this.timesheetService.rejectTimesheet(id, reason).subscribe(() => this.loadTimesheets());
    }
  }
}