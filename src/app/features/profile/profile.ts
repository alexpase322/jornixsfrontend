import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../core/services/profile'; 
import { RouterModule } from '@angular/router';
import { PaymentService } from '../../core/services/payment';
import { AuthService } from '../../core/services/auth';
import { inject } from '@angular/core';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.html',
})
export class ProfileComponent implements OnInit {
  private paymentService = inject(PaymentService); // <-- Inyectar
  private authService = inject(AuthService); // <-- Inyectar
  public userRole = this.authService.userRole; // <
  profileForm: FormGroup;
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  constructor(private fb: FormBuilder, private profileService: ProfileService) {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      
      // La contraseña es opcional, pero si se escribe, debe tener un mínimo de 8 caracteres
      newPassword: ['', [Validators.minLength(8)]],
      
      streetAddress: ['', Validators.required],
      cityStateZip: ['', [
        Validators.required,
        Validators.pattern(/^.+,\s*[A-Z]{2}\s+\d{5}(-\d{4})?$/)
      ]],
      ssn: ['', [
        Validators.required,
        Validators.pattern('^(?!000|666)[0-8][0-9]{2}-(?!00)[0-9]{2}-(?!0000)[0-9]{4}$')
      ]]
    });
  }

  ngOnInit(): void {
    this.profileService.getProfile().subscribe(profile => {
      this.profileForm.patchValue(profile);
    });
  }

  onSubmit(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    // Filtramos los valores nulos o vacíos para no enviar campos que no se quieren cambiar
    const formData = Object.fromEntries(
      Object.entries(this.profileForm.getRawValue()).filter(([key, value]) => value !== '' && value !== null)
    );

    if (Object.keys(formData).length === 0) {
        this.errorMessage.set("No hay cambios para guardar.");
        return;
    }

    this.profileService.updateProfile(formData).subscribe({
        next: () => {
            this.successMessage.set('¡Perfil actualizado con éxito!');
            this.profileForm.get('newPassword')?.reset(''); // Limpiamos el campo de contraseña
            setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: () => {
            this.errorMessage.set('Error al actualizar el perfil.');
        }
    });
  }
  onCancelSubscription(): void {
    if (confirm('¿Estás seguro de que quieres cancelar tu suscripción? Tu plan permanecerá activo hasta el final del ciclo de facturación.')) {
      this.paymentService.cancelSubscription().subscribe({
        next: (message) => {
          this.successMessage.set(message);
          // Aquí podríamos también recargar el estado del perfil para mostrar que está "Cancelado"
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al cancelar la suscripción.');
        }
      });
    }
  }
}
