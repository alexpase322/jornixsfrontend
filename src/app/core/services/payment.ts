import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly PAYMENT_URL = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) { }

  createCheckoutSession(priceId: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.PAYMENT_URL}/create-checkout-session`, { priceId });
  }

  cancelSubscription(): Observable<string> {
    // El backend devuelve un string de confirmación
    return this.http.post(`${environment.apiUrl}/payments/cancel-subscription`, {}, { responseType: 'text' });
  }
}
