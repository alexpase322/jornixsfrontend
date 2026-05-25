import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin';
import { Worker, ConsolidatedPayrollReport, DetailedPayrollReport } from '../../../core/models/admin.models';
import flatpickr from 'flatpickr';
import { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance';

@Component({
  selector: 'app-payroll-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payroll-report.html',
})
export class PayrollReportComponent implements OnInit, AfterViewInit, OnDestroy {
  reportForm: FormGroup;
  workers = signal<Worker[]>([]);

  consolidatedReport = signal<ConsolidatedPayrollReport | null>(null);
  detailedReport = signal<DetailedPayrollReport | null>(null);

  isLoading = signal<boolean>(false);

  @ViewChild('startDateInput') startDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('endDateInput') endDateInput?: ElementRef<HTMLInputElement>;
  private startPicker?: FlatpickrInstance;
  private endPicker?: FlatpickrInstance;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Form holds ISO (YYYY-MM-DD) values; flatpickr displays MM/DD/YYYY.
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

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initFlatpickr('startDate', this.startDateInput);
    this.initFlatpickr('endDate', this.endDateInput);
  }

  ngOnDestroy(): void {
    this.startPicker?.destroy();
    this.endPicker?.destroy();
  }

  private initFlatpickr(controlName: 'startDate' | 'endDate', el?: ElementRef<HTMLInputElement>): void {
    if (!el) return;
    const instance = flatpickr(el.nativeElement, {
      dateFormat: 'm/d/Y',          // visible format MM/DD/YYYY
      altInput: false,
      allowInput: true,
      onChange: (selectedDates) => {
        const d = selectedDates[0];
        const iso = d
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          : '';
        this.reportForm.get(controlName)?.setValue(iso);
      }
    });
    if (controlName === 'startDate') this.startPicker = instance;
    else this.endPicker = instance;
  }

  // Backend stores LocalTime as UTC on a UTC server. We reinterpret as UTC
  // using the log's actual date so DST is applied correctly, then format in
  // the device's local timezone.
  private readonly localTimeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  formatEventTime(value: string | null | undefined, referenceDate?: string | null): string {
    if (!value) return '--:--';
    const m = value.match(/^(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/);
    if (!m) return '--:--';
    const [, hh, mm, ss] = m;

    // Use the log's actual date so DST rules are applied correctly.
    let year = 1970, month = 0, day = 1;
    if (referenceDate) {
      const dm = referenceDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dm) {
        year = parseInt(dm[1], 10);
        month = parseInt(dm[2], 10) - 1;
        day = parseInt(dm[3], 10);
      }
    }

    const utcDate = new Date(Date.UTC(
      year, month, day,
      parseInt(hh, 10),
      parseInt(mm, 10),
      ss ? parseInt(ss, 10) : 0
    ));
    return this.localTimeFormatter.format(utcDate);
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
