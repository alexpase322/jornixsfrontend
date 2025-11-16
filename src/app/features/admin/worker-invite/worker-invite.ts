import { Component, OnInit, signal } from '@angular/core'; // <-- Añadir OnInit
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth'; 
import { WorkLocationService } from '../../../core/services/work-location';
import { WorkLocation } from '../../../core/models/work-location.models';

@Component({
  selector: 'app-worker-invite',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './worker-invite.html',
})
export class WorkerInviteComponent implements OnInit{
  inviteForm: FormGroup;
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  locations = signal<WorkLocation[]>([]); // <-- Signal para las ubicaciones

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private locationService: WorkLocationService
  ) {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      hourlyRate: ['', [Validators.required, Validators.min(0.01)]],
      workLocationId: [null]
    });
  }
  ngOnInit(): void {
    // Al cargar el componente, obtenemos la lista de lugares de trabajo
    this.locationService.getLocations().subscribe(data => {
      this.locations.set(data);
    });
  }

  sendInvitation(): void {
    if (this.inviteForm.invalid) return;

    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.authService.inviteWorker(this.inviteForm.value).subscribe({
      next: (response) => {
        this.successMessage.set(response);
        setTimeout(() => this.router.navigate(['/admin/workers']), 2000); // Redirige a la lista tras 2 segundos
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al enviar la invitación.');
      }
    });
  }
}
