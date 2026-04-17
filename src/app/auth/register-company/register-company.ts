import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { CloudinaryService } from '../../core/services/cloudinary';
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
  logoPreview = signal<string | null>(null);
  logoUrl = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    public cloudinaryService: CloudinaryService
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
      termsAccepted: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.inviteToken = params.get('token');
      if (!this.inviteToken) {
        this.errorMessage.set('Enlace de registro invalido. Por favor, utiliza el enlace enviado a tu correo electronico.');
        this.registrationForm.disable();
      }
    });
  }

  async onLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Solo se permiten archivos de imagen (PNG, JPG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('La imagen no puede superar 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.logoPreview.set(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const url = await this.cloudinaryService.uploadImage(file);
      this.logoUrl.set(url);
      this.errorMessage.set(null);
    } catch {
      this.errorMessage.set('Error al subir el logo. Intenta de nuevo.');
      this.logoPreview.set(null);
    }
  }

  removeLogo(): void {
    this.logoPreview.set(null);
    this.logoUrl.set(null);
  }

  onSubmit(): void {
    if (this.registrationForm.invalid || !this.inviteToken) {
      return;
    }

    const formData = {
      token: this.inviteToken,
      ...this.registrationForm.value,
      logoUrl: this.logoUrl()
    };

    this.authService.registerCompany(formData).subscribe({
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Ocurrio un error durante el registro.');
      }
    });
  }
}
