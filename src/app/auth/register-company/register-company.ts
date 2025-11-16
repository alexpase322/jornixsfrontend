import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { ModalComponent } from '../../shared/modal/modal';

@Component({
  selector: 'app-register-company',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './register-company.html',
})
export class RegisterCompanyComponent implements OnInit {
  registrationForm: FormGroup;
  inviteToken: string | null = null;
  errorMessage = signal<string | null>(null);
  isTermsModalOpen = signal(false);
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    this.registrationForm = this.fb.group({
      companyName: ['', Validators.required],
      companyAddress: ['', Validators.required],
      ein: ['', Validators.required],
      adminFullName: ['', Validators.required],
      adminEmail: ['', [Validators.required, Validators.email]],
      adminPassword: ['', [Validators.required, Validators.minLength(8)]],
      companyPhoneNumber: [''],
      workLatitude: [null],
      workLongitude: [null],
      geofenceRadiusMeters: [null],
      termsAccepted: [false, Validators.requiredTrue] // <-- Añadir
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.inviteToken = params.get('token');
      if (!this.inviteToken) {
        this.errorMessage.set('Enlace de registro inválido. Por favor, utiliza el enlace enviado a tu correo electrónico.');
        this.registrationForm.disable();
      }
    });
  }

  onSubmit(): void {
    if (this.registrationForm.invalid || !this.inviteToken) {
      return;
    }

    const formData = {
      token: this.inviteToken,
      ...this.registrationForm.value
    };

    this.authService.registerCompany(formData).subscribe({
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Ocurrió un error durante el registro.');
      }
    });
  }
}
