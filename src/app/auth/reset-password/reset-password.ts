import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth'; 

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.html',
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  private resetToken: string | null = null;
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.resetToken = params.get('token');
      if (!this.resetToken) {
        this.errorMessage.set('Token inválido o no encontrado.');
        this.resetPasswordForm.disable();
      }
    });
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid || !this.resetToken) return;
    
    const data = {
      token: this.resetToken,
      newPassword: this.resetPasswordForm.value.newPassword
    };
    
    this.authService.resetPassword(data).subscribe({
      next: (message) => {
        this.successMessage.set(message);
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => this.errorMessage.set(err.error?.message || 'Error al restablecer la contraseña.')
    });
  }
}