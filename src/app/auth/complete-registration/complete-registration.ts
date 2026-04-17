import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-complete-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './complete-registration.html',
})
export class CompleteRegistrationComponent implements OnInit {
  registrationForm: FormGroup;
  registrationToken: string | null = null;
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute, // Para leer parámetros de la URL
    private router: Router
  ) {
    this.registrationForm = this.fb.group({
      fullName: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      streetAddress: ['', Validators.required],
      cityStateZip: ['', [
        Validators.required,
        // Valida el formato: "Ciudad, ST 12345" o "Ciudad, ST 12345-6789"
        Validators.pattern(/^.+,\s*[A-Z]{2}\s+\d{5}(-\d{4})?$/)
      ]],
      ssn: ['', [Validators.required, Validators.pattern('^(?!000|666)[0-8][0-9]{2}-(?!00)[0-9]{2}-(?!0000)[0-9]{4}$')]],
    });
  }

  ngOnInit(): void {
    // Leemos el token de la URL (ej: ?token=xyz...)
    this.route.queryParamMap.subscribe(params => {
      this.registrationToken = params.get('token');
      if (!this.registrationToken) {
        this.errorMessage.set('Token de registro no encontrado o inválido.');
        // Opcional: redirigir a una página de error o al login
        // this.router.navigate(['/login']);
      }
    });
  }

  onSubmit(): void {
    if (this.registrationForm.invalid || !this.registrationToken) {
      return;
    }

    const formData = {
      token: this.registrationToken,
      ...this.registrationForm.value
    };

    this.authService.completeRegistration(formData).subscribe({
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Ocurrió un error al completar el registro.');
      }
    });
  }

  formatSsn(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 9);
    let formatted = digits;
    if (digits.length > 5) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    } else if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    input.value = formatted;
    this.registrationForm.get('ssn')?.setValue(formatted, { emitEvent: false });
  }
}
