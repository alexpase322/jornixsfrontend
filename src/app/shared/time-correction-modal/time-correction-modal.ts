import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TimeLog } from '../../core/models/timelog.models';
// Importamos los 3 servicios que necesitamos
import { AdminService } from '../../core/services/admin'; 
import { TimeLogService } from '../../core/services/time-log';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-time-correction-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './time-correction-modal.html',
})
export class TimeCorrectionModalComponent implements OnInit {
  // Inyectamos los servicios
  private authService = inject(AuthService);
  private adminService = inject(AdminService);
  private timeLogService = inject(TimeLogService);
  
  public userRole = this.authService.userRole;

  @Input() workerId: number | undefined;
  @Input( { required: true }) logToEdit: TimeLog | null = null;
  @Input() dateForNewLog: string | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  correctionForm: FormGroup;
  isEditMode = false;
  eventTypes = ['INGRESO', 'INICIO_ALMUERZO', 'FINAL_ALMUERZO', 'SALIDA'];

  constructor(private fb: FormBuilder) {
    this.correctionForm = this.fb.group({
      eventType: ['', Validators.required],
      timestamp: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.logToEdit) {
      this.isEditMode = true;
      this.correctionForm.patchValue({
        eventType: this.logToEdit.eventType,
        timestamp: this.logToEdit.timestamp.slice(0, 16)
      });
    } else if (this.dateForNewLog) {
      this.isEditMode = false;
      this.correctionForm.get('timestamp')?.setValue(`${this.dateForNewLog}T12:00`);
    }
  }

  onSave(): void {
    if (this.correctionForm.invalid) return;

    if (this.userRole() === 'ROLE_ADMINISTRADOR') {
      if (!this.workerId) {
        console.error("Error: Se requiere un ID de trabajador para la corrección del administrador.");
        return;
      }
      // Construye la petición para el endpoint del administrador
      const request = {
        workerId: this.workerId,
        eventType: this.correctionForm.value.eventType,
        timestamp: this.correctionForm.value.timestamp,
        // Si estamos en modo edición, enviamos el ID. Si no, enviamos null.
        timeLogIdToEdit: this.isEditMode ? this.logToEdit?.id : null
      };
      this.adminService.correctTimeLog(request).subscribe(() => {
        this.save.emit();
      });
    } else if (this.userRole() === 'ROLE_TRABAJADOR') {
      const request = {
        ...this.correctionForm.value,
        timeLogIdToEdit: this.isEditMode ? this.logToEdit?.id : null
      };
      
      // --- LLAMADA CORREGIDA ---
      // Cambiamos 'correctMyTimeLog' por 'correctWorkerTimeLog'
      this.timeLogService.correctWorkerTimeLog(request).subscribe(() => this.save.emit());
    }
  }
}