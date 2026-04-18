import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin';
import { Worker, ConsolidatedPayrollReport, DetailedPayrollReport } from '../../../core/models/admin.models';

// MM/DD/YYYY validator + converter utilities
const MMDDYYYY_REGEX = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;

function mmddyyyyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    if (!MMDDYYYY_REGEX.test(value)) {
      return { mmddyyyy: true };
    }
    return null;
  };
}

function mmddyyyyToIso(value: string): string {
  if (!value || !MMDDYYYY_REGEX.test(value)) return '';
  const [mm, dd, yyyy] = value.split('/');
  return `${yyyy}-${mm}-${dd}`;
}

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
    this.reportForm = this.fb.group({
      reportType: ['CONSOLIDATED', Validators.required],
      workerId: [null],
      startDate: ['', [Validators.required, mmddyyyyValidator()]],
      endDate: ['', [Validators.required, mmddyyyyValidator()]],
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

  // Auto-format MM/DD/YYYY as user types
  formatDate(event: Event, controlName: 'startDate' | 'endDate'): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    input.value = formatted;
    this.reportForm.get(controlName)?.setValue(formatted, { emitEvent: false });
  }

  // Returns { reportType, workerId, startDate, endDate } with dates converted to ISO for backend
  private getIsoParams() {
    const raw = this.reportForm.value;
    return {
      reportType: raw.reportType,
      workerId: raw.workerId,
      startDate: mmddyyyyToIso(raw.startDate),
      endDate: mmddyyyyToIso(raw.endDate)
    };
  }

  // Filename-safe date fragment: MM-DD-YYYY
  private dateForFilename(value: string): string {
    return (value || '').replace(/\//g, '-');
  }

  generateReport(): void {
    if (this.reportForm.invalid) return;
    this.isLoading.set(true);
    this.consolidatedReport.set(null);
    this.detailedReport.set(null);

    const { reportType, workerId, startDate, endDate } = this.getIsoParams();

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
    const { startDate, endDate } = this.getIsoParams();
    const rawStart = this.reportForm.value.startDate;
    const rawEnd = this.reportForm.value.endDate;
    this.adminService.downloadConsolidatedPdf(startDate, endDate).subscribe(blob => {
      this.triggerDownload(blob, `payroll-report-${this.dateForFilename(rawStart)}-to-${this.dateForFilename(rawEnd)}.pdf`);
    });
  }

  downloadExcel(): void {
    if (!this.consolidatedReport() || this.reportForm.invalid) return;
    const { startDate, endDate } = this.getIsoParams();
    const rawStart = this.reportForm.value.startDate;
    const rawEnd = this.reportForm.value.endDate;
    this.adminService.downloadConsolidatedExcel(startDate, endDate).subscribe(blob => {
      this.triggerDownload(blob, `payroll-report-${this.dateForFilename(rawStart)}-to-${this.dateForFilename(rawEnd)}.xlsx`);
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
    const { workerId, startDate, endDate } = this.getIsoParams();
    const rawStart = this.reportForm.value.startDate;
    const workerName = this.detailedReport()?.workerName.replace(/\s+/g, '_');
    this.adminService.downloadDetailedPdf(workerId, startDate, endDate).subscribe(blob => {
      this.triggerDownload(blob, `detailed-report-${workerName}-${this.dateForFilename(rawStart)}.pdf`);
    });
  }

  downloadDetailedExcel(): void {
    if (!this.detailedReport() || this.reportForm.invalid) return;
    const { workerId, startDate, endDate } = this.getIsoParams();
    const rawStart = this.reportForm.value.startDate;
    const workerName = this.detailedReport()?.workerName.replace(/\s+/g, '_');
    this.adminService.downloadDetailedExcel(workerId, startDate, endDate).subscribe(blob => {
      this.triggerDownload(blob, `detailed-report-${workerName}-${this.dateForFilename(rawStart)}.xlsx`);
    });
  }
}
