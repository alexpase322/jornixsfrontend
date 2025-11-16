import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin';
import { Worker } from '../../../core/models/admin.models';
import { FormControl, ReactiveFormsModule } from '@angular/forms'; // <-- Importar

@Component({
  selector: 'app-worker-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule], // <-- Añadir ReactiveFormsModule
  templateUrl: './worker-list.html',
})
export class WorkerListComponent implements OnInit {
  public workers = signal<Worker[]>([]);
  public filterControl = new FormControl('ACTIVE'); // <-- Control para el filtro

  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit(): void {
    this.loadWorkers(); // Carga inicial

    // Escuchamos los cambios en el filtro y recargamos la lista
    this.filterControl.valueChanges.subscribe(() => {
      this.loadWorkers();
    });
  }

  loadWorkers(): void {
    const status = this.filterControl.value as 'ACTIVE' | 'INACTIVE' | 'ALL';
    this.adminService.getWorkers(status).subscribe(data => {
      this.workers.set(data);
    });
  }

  editWorker(id: number): void {
    this.router.navigate(['/admin/workers', id, 'edit']);
  }
}