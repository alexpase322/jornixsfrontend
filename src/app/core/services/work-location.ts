import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WorkLocation, CreateOrUpdateLocationRequest } from '../models/work-location.models';

@Injectable({
  providedIn: 'root'
})
export class WorkLocationService {
  private readonly LOCATIONS_URL = `${environment.apiUrl}/admin/work-locations`;

  constructor(private http: HttpClient) { }

  getLocations(): Observable<WorkLocation[]> {
    return this.http.get<WorkLocation[]>(this.LOCATIONS_URL);
  }

  createLocation(data: CreateOrUpdateLocationRequest): Observable<WorkLocation> {
    return this.http.post<WorkLocation>(this.LOCATIONS_URL, data);
  }

  updateLocation(id: number, data: CreateOrUpdateLocationRequest): Observable<WorkLocation> {
    return this.http.put<WorkLocation>(`${this.LOCATIONS_URL}/${id}`, data);
  }

  deleteLocation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.LOCATIONS_URL}/${id}`);
  }

  getLocationById(id: number): Observable<WorkLocation> {
    return this.http.get<WorkLocation>(`${this.LOCATIONS_URL}/${id}`);
  }
}
