import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClockInRequest, TimeLog } from '../models/timelog.models';
import { DetailedPayrollReport } from '../models/admin.models'; // Reutilizamos este modelo

@Injectable({
  providedIn: 'root'
})
export class TimeLogService {
  private readonly TIMELOG_URL = `${environment.apiUrl}/worker/timelogs`;
  private readonly REPORT_URL = `${environment.apiUrl}/reports`; // URL base para reportes
  constructor(private http: HttpClient) { }

  clockIn(data: ClockInRequest): Observable<TimeLog> {
    return this.http.post<TimeLog>(`${this.TIMELOG_URL}/clock-in`, data);
  }

  startLunch(): Observable<TimeLog> {
    return this.http.post<TimeLog>(`${this.TIMELOG_URL}/start-lunch`, {});
  }

  endLunch(): Observable<TimeLog> {
    return this.http.post<TimeLog>(`${this.TIMELOG_URL}/end-lunch`, {});
  }

  clockOut(): Observable<TimeLog> {
    return this.http.post<TimeLog>(`${this.TIMELOG_URL}/clock-out`, {});
  }

  getWeeklyLogs(): Observable<TimeLog[]> {
    return this.http.get<TimeLog[]>(`${this.TIMELOG_URL}/week`);
  }

  getMyDetailedReport(startDate: string, endDate: string): Observable<DetailedPayrollReport> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<DetailedPayrollReport>(`${this.REPORT_URL}/detailed/me`, { params });
  }

  correctWorkerTimeLog(data: any): Observable<TimeLog> {
    return this.http.post<TimeLog>(`${this.TIMELOG_URL}/correction`, data);
  }
}
