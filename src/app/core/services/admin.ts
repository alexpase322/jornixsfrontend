import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardStats } from '../models/admin.models';
import { Worker, UpdateWorkerRequest } from '../models/admin.models';
import { PayrollReport } from '../models/auth.models';
import { HttpParams } from '@angular/common/http';
import { ConsolidatedPayrollReport } from '../models/admin.models';
import { DetailedPayrollReport } from '../models/admin.models';
import { TimeLog } from '../models/timelog.models'; // Y este también

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly ADMIN_URL = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) { }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.ADMIN_URL}/dashboard-stats`);
  }

  getWorkers(status: 'ACTIVE' | 'INACTIVE' | 'ALL'): Observable<Worker[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<Worker[]>(`${this.ADMIN_URL}/workers`, { params });
  }

  getWorkerById(id: number): Observable<Worker> {
    return this.http.get<Worker>(`${this.ADMIN_URL}/workers/${id}`);
  }

  updateWorker(id: number, data: UpdateWorkerRequest): Observable<Worker> {
    return this.http.put<Worker>(`${this.ADMIN_URL}/workers/${id}`, data);
  }

  deactivateWorker(id: number): Observable<void> {
    return this.http.delete<void>(`${this.ADMIN_URL}/workers/${id}`);
  }

  generatePayrollReport(startDate: string, endDate: string): Observable<PayrollReport> {
    // Los parámetros se envían como query params en la URL
    return this.http.get<PayrollReport>(`${this.ADMIN_URL}/reports/payroll`, {
      params: { startDate, endDate }
    });
  }

  generateConsolidatedReport(startDate: string, endDate: string): Observable<ConsolidatedPayrollReport> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<ConsolidatedPayrollReport>(`${this.ADMIN_URL}/reports/consolidated-payroll`, { params });
  }


  generateDetailedReport(workerId: number, startDate: string, endDate: string): Observable<DetailedPayrollReport> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<DetailedPayrollReport>(`${this.ADMIN_URL}/reports/detailed-payroll/${workerId}`, { params });
  }

  downloadConsolidatedPdf(startDate: string, endDate: string): Observable<Blob> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    // Le decimos a HttpClient que esperamos un archivo (Blob)
    return this.http.get(`${this.ADMIN_URL}/reports/consolidated-payroll/pdf`, { 
      params, 
      responseType: 'blob' 
    });
  }

  downloadConsolidatedExcel(startDate: string, endDate: string): Observable<Blob> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get(`${this.ADMIN_URL}/reports/consolidated-payroll/excel`, { 
      params, 
      responseType: 'blob' 
    });
  }

  downloadDetailedPdf(workerId: number, startDate: string, endDate: string): Observable<Blob> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get(`${this.ADMIN_URL}/reports/detailed-payroll/${workerId}/pdf`, { 
      params, 
      responseType: 'blob' 
    });
  }

  downloadDetailedExcel(workerId: number, startDate: string, endDate: string): Observable<Blob> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get(`${this.ADMIN_URL}/reports/detailed-payroll/${workerId}/excel`, { 
      params, 
      responseType: 'blob' 
    });
  }

  correctTimeLog(data: any): Observable<TimeLog> { // 'any' por simplicidad, se podría crear un modelo
    return this.http.post<TimeLog>(`${this.ADMIN_URL}/timelogs/correction`, data);
  }

  deleteTimeLog(id: number): Observable<void> {
    return this.http.delete<void>(`${this.ADMIN_URL}/timelogs/${id}`);
  }
}
