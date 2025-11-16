import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UpdateProfileRequest, UserProfile } from '../models/profile.models';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly PROFILE_URL = `${environment.apiUrl}/profile`;

  constructor(private http: HttpClient) { }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.PROFILE_URL);
  }

  updateProfile(data: UpdateProfileRequest): Observable<string> { // 1. Cambia el tipo a Observable<string>
    // 2. Añade la opción para que espere una respuesta de texto
    return this.http.put(`${this.PROFILE_URL}/update`, data, { responseType: 'text' });
  }
}