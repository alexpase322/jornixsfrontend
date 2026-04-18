import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin';
import { Worker, ConsolidatedPayrollReport, DetailedPayrollReport } from '../../../core/models/admin.models';

@Component({
  selector: 'app-payroll-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payroll-report.html',
})
export class PayrollReportComponent implements OnInit {
  reportForm: FormGroup;
  workers = signal<Worker[]>([]);

  consolidatedReport = signal<ConsolidatedPayrollReport | null>(null);
  detailedReport = signal<DetailedPayrollReport | null>(null);

  isLoading = signal<boolean>(false);

  constructor(private fb: FormBuilder, private adminService: AdminService) {
    // Form uses ISO (YYYY-MM-DD) from native <input type="date"> — matches backend @DateTimeFormat.ISO.DATE
    this.reportForm = this.fb.group({
      reportType: ['CONSOLIDATED', Validators.required],
      workerId: [null],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });

    this.reportForm.get('reportType')?.valueChanges.subscribe(type => {
      const workerIdControl = this.reportForm.get('workerId');
      if (type === 'DETAILED') {
        workerIdControl?.setValidators(Validators.required);
      } else {
        workerIdControl?.clearValidators();
      }
      workerIdControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.adminService.getWorkers('ALL').subscribe(data => this.workers.set(data));
  }

  // Convert ISO (YYYY-MM-DD) from native date input to MM/DD/YYYY for display overlay
  formatDateDisplay(isoDate: string | null | undefined): string {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    const [y, m, d] = parts;
    return `${m}/${d}/${y}`;
  }

  // Filename-safe date fragment: YYYY-MM-DD → MM-DD-YYYY
  private dateForFilename(isoDate: string): string {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${m}-${d}-${y}`;
  }

  generateReport(): void {
    if (this.reportForm.invalid) return;
    this.isLoading.set(true);
    this.consolidatedReport.set(null);
    this.detailedReport.set(null);

    const { reportType, workerId, startDate, endDate } = this.reportForm.value;

    if (reportType === 'CONSOLIDATED') {
      this.adminService.generateConsolidatedReport(startDate, endDate).subscribe(data => {
        this.consolidatedReport.set(data);
        this.isLoading.set(false);
      });
    } else if (reportType === 'DETAILED') {
      this.adminService.generateDetailedReport(workerId, startDate, endDate).subscribe(data => {
        this.detailedReport.set(data);
        this.isLoading.set(false);
      });
    }
  }

  downloadPdf(): void {
    if (!this.consolidatedReport() || this.reportForm.invalid) return;
    const { startDate, endDate } = this.reportForm.value;
    this.adminService.downloadConsolidatedPdf(startDate, endDate).subscribe(blob => {
      this.triggerDownload(blob, `payroll-report-${this.dateForFilename(startDate)}-to-${this.dateForFilename(endDate)}.pdf`);
    });
  }

  downloadExcel(): void {
    if (!this.consolidatedReport() || this.reportForm.invalid) return;
    const { startDate, endDate } = this.reportForm.value;
    this.adminService.downloadConsolidatedExcel(startDate, endDate).subscribe(blob => {
      this.triggerDownload(blob, `payroll-report-${this.dateForFilename(startDate)}-to-${this.dateForFilename(endDate)}.xlsx`);
    });
  }

  private triggerDownload(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }

  downloadDetailedPdf(): void {
    if (!this.detailedReport() || this.reportForm.invalid) return;
    const { workerId, startDate, endDate } = this.reportForm.value;
    const workerName = this.detailedReport()?.workerName.replace(/\s+/g, '_');
    this.adminService.downloadDetailedPdf(workerId, startDate, endDate).subscribe(blob => {
      this.triggerDownload(blob, `detailed-report-${workerName}-${this.dateForFilename(startDate)}.pdf`);
    });
  }

  downloadDetailedExcel(): void {
    if (!this.detailedReport() || this.reportForm.invalid) return;
    const { workerId, startDate, endDate } = this.reportForm.value;
    const workerName = this.detailedReport()?.workerName.replace(/\s+/g, '_');
    this.adminService.downloadDetailedExcel(workerId, startDate, endDate).subscribe(blob => {
      this.triggerDownload(blob, `detailed-report-${workerName}-${this.dateForFilename(startDate)}.xlsx`);
    });
  }
}
