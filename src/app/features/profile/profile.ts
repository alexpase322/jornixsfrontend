import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../core/services/profile';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.html',
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  constructor(private fb: FormBuilder, private profileService: ProfileService) {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
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
    this.profileForm.get('ssn')?.setValue(formatted, { emitEvent: false });
  }

  onSubmit(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const formData = Object.fromEntries(
      Object.entries(this.profileForm.getRawValue()).filter(([key, value]) => value !== '' && value !== null)
    );

    if (Object.keys(formData).length === 0) {
      this.errorMessage.set('No hay cambios para guardar.');
      return;
    }

    this.profileService.updateProfile(formData).subscribe({
      next: () => {
        this.successMessage.set('Perfil actualizado con exito!');
        this.profileForm.get('newPassword')?.reset('');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: () => {
        this.errorMessage.set('Error al actualizar el perfil.');
      }
    });
  }
}
