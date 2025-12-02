import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // <--- Importar HttpClient
import { environment } from '../../../../environments/environment'; // Tu archivo de entorno

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.css'
})
export class PaymentSuccess implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient); // <--- Inyectar HttpClient

  paymentId: string = '';
  amount: number = 0;      // <--- Variable para el monto
  currency: string = 'USD'; // <--- Variable para la moneda
  isLoading: boolean = true;
  date: Date = new Date();

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.paymentId = params['session_id'];

      if (this.paymentId) {
        this.getPaymentDetails(this.paymentId);
      }
    });
  }

  getPaymentDetails(sessionId: string) {
    // Llamamos al nuevo endpoint del backend
    this.http.get<any>(`${environment.apiUrl}/payments/session/${sessionId}`)
      .subscribe({
        next: (data) => {
          this.amount = data.amount;
          this.currency = data.currency;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error obteniendo detalles del pago', err);
          this.isLoading = false;
          // Opcional: Mostrar monto por defecto o error
        }
      });
  }

  goToDashboard() {
    const userRole = localStorage.getItem('role') || 'TRABAJADOR';
    if (userRole === 'ADMINISTRADOR' || userRole === 'ROLE_ADMINISTRADOR') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/worker/dashboard']);
    }
  }
}
