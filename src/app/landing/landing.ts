import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';

// Importamos el servicio de pagos
import { PaymentService } from '../core/services/payment';
import { AnimateOnScrollDirective } from '../shared/directives/animate-on-scroll';
import { ModalComponent } from '../shared/modal/modal'; 

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterModule, CommonModule, ReactiveFormsModule, AnimateOnScrollDirective, ModalComponent],
  templateUrl: './landing.html',
})
export class LandingComponent {
  // Inyectamos el servicio
  private paymentService = inject(PaymentService);

  termsAccepted = new FormControl(false, Validators.requiredTrue);
  isTermsModalOpen = signal(false);
  openFaq: number | null = null;
  isAnnual: boolean = false;
  isLoading = false;

  plans = [
    {
      name: 'Entrepreneur',
      workers: '1 a 10',
      features: ['Time tracking', 'Consolidated reports', 'Email support'],
      price: {
        monthly: 19,
        yearly: 160 
      },
      stripePriceId: {
        monthly: 'price_1SIeqOLfOYfy0olvCdtPv8oZ',
        yearly: 'price_1SagiALfOYfy0olvfnnDY34o' // <--- FALTANTE DE STRIPE
      }
    },
    {
      name: 'Growth',
      workers: '11 a 50',
      features: ['Everything in Entrepreneur', 'Approval of hours', 'Location management'],
      price: {
        monthly: 49,
        yearly: 380
      },
      stripePriceId: {
        monthly: 'price_1SIesCLfOYfy0olvCw9ZgZur',
        yearly: 'price_1SagsQLfOYfy0olvhHkTYtn4' // <--- FALTANTE DE STRIPE
      }
    },
    {
      name: 'Corporate',
      workers: '51+',
      features: ['Everything in Growth', 'Detailed reports', 'PDF/Excel export'],
      price: {
        monthly: 99,
        yearly: 710
      },
      stripePriceId: {
        monthly: 'price_1SIesyLfOYfy0olvhi1gFeFz',
        yearly: 'price_1SaguNLfOYfy0olvwJPuazCO' // <--- FALTANTE DE STRIPE
      }
    }
  ];

  scrollToPlans(plansSection: HTMLElement): void {
    plansSection.scrollIntoView({ behavior: 'smooth' });
  }

  // --- MÉTODO ACTUALIZADO ---
  subscribe(planPriceId: string): void {
    if (this.termsAccepted.invalid) {
      alert('Debes aceptar los términos y condiciones para continuar.');
      return;
    }
    
    // 1. Llamamos al servicio para crear la sesión de pago en el backend
    this.paymentService.createCheckoutSession(planPriceId).subscribe({
      next: (session) => {
        // 2. Si es exitoso, redirigimos al usuario a la URL de pago de Stripe
        window.location.href = session.url;
      },
      error: (err) => {
        console.error('Error al crear la sesión de pago:', err);
        alert('Hubo un problema al iniciar el proceso de pago. Por favor, inténtalo de nuevo más tarde.');
      }
    });
  }

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }

  toggleBilling() {
    this.isAnnual = !this.isAnnual;
  }

  // Método de compra
  buyPlan(priceId: string) {
    if (!priceId || priceId.includes('PON_AQUI')) {
      alert('El plan anual aún no está configurado.');
      return;
    }

    this.isLoading = true;
    this.paymentService.createCheckoutSession(priceId).subscribe({
      next: (res) => {
        window.location.href = res.url;
      },
      error: (err) => {
        console.error(err);
        alert('Error al iniciar el pago.');
        this.isLoading = false;
      }
    });
  }
}