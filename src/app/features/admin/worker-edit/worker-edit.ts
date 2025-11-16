import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin';
import { WorkLocationService } from '../../../core/services/work-location'; 
import { WorkLocation } from '../../../core/models/work-location.models'; // <-- Importar

@Component({
  selector: 'app-worker-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './worker-edit.html',
})
export class WorkerEditComponent implements OnInit {
  editForm: FormGroup;
  workerId!: number;
  locations = signal<WorkLocation[]>([]); // <-- Signal para las ubicaciones

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router,
    private locationService: WorkLocationService // <-- Inyectar servicio
  ) {
    this.editForm = this.fb.group({
      fullName: ['', Validators.required],
      hourlyRate: ['', [Validators.required, Validators.min(0)]],
      active: [true],
      workLocationId: [null] // <-- Nuevo control
    });
  }

  ngOnInit(): void {
    this.locationService.getLocations().subscribe(data => {
      this.locations.set(data);
    });

    this.workerId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.workerId) {
      this.adminService.getWorkerById(this.workerId).subscribe(worker => {
        // El 'patchValue' asignará el workLocationId si existe
        this.editForm.patchValue(worker);
      });
    }
  }

  saveChanges(): void {
    if (this.editForm.valid) {
      this.adminService.updateWorker(this.workerId, this.editForm.value).subscribe(() => {
        this.router.navigate(['/admin/workers']);
      });
    }
  }
}
