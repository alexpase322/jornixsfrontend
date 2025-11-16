import { Injectable } from '@angular/core';
import { HttpClient, HttpParams  } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TimesheetSummary } from '../models/timesheet.models';

@Injectable({ providedIn: 'root' })
export class TimesheetService {
  private readonly ADMIN_URL = `${environment.apiUrl}/admin/timesheets`;
  private readonly WORKER_URL = `${environment.apiUrl}/worker/timesheets`; // <-- Añadir
  private readonly BASE_URL = `${environment.apiUrl}`;
  constructor(private http: HttpClient) { }

  getSubmittedTimesheets(): Observable<TimesheetSummary[]> {
    return this.http.get<TimesheetSummary[]>(`${this.ADMIN_URL}/submitted`);
  }

  approveTimesheet(id: number): Observable<string> {
    return this.http.post(`${this.ADMIN_URL}/${id}/approve`, {}, { responseType: 'text' });
  }

  rejectTimesheet(id: number, reason: string): Observable<string> {
    return this.http.post(`${this.ADMIN_URL}/${id}/reject`, { reason }, { responseType: 'text' });
  }

  submitWeek(workWeekId: number): Observable<string> {
    return this.http.post(`${this.WORKER_URL}/submit/${workWeekId}`, {}, { responseType: 'text' });
  }

  getFilteredTimesheets(status?: string, workerId?: number): Observable<TimesheetSummary[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    if (workerId) {
      params = params.set('workerId', workerId.toString());
    }
    return this.http.get<TimesheetSummary[]>(`${this.BASE_URL}/timesheets`, { params });
  }

  // --- Método para Reabrir Hoja de Horas ---
  resubmitTimesheet(timesheetId: number): Observable<string> {
    return this.http.post(`${this.BASE_URL}/worker/timesheets/${timesheetId}/resubmit`, {}, { responseType: 'text' });
  }
}