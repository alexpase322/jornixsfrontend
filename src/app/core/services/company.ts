import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompanyInfo, UpdateCompanyRequest } from '../models/company.models';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private readonly COMPANY_URL = `${environment.apiUrl}/admin/company`;

  constructor(private http: HttpClient) {}

  getCompanyInfo(): Observable<CompanyInfo> {
    return this.http.get<CompanyInfo>(this.COMPANY_URL);
  }

  updateCompanyInfo(data: UpdateCompanyRequest): Observable<CompanyInfo> {
    return this.http.put<CompanyInfo>(this.COMPANY_URL, data);
  }

  uploadLogo(file: File): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ logoUrl: string }>(`${this.COMPANY_URL}/logo`, formData);
  }
}
