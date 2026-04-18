import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WorkLocation } from '../../../core/models/work-location.models';
import { WorkLocationService } from '../../../core/services/work-location'; 

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './location-list.html',
})
export class LocationListComponent implements OnInit {
  public locations = signal<WorkLocation[]>([]);

  constructor(private locationService: WorkLocationService) {}

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.locationService.getLocations().subscribe(data => {
      this.locations.set(data);
    });
  }

  deleteLocation(id: number): void {
    if (confirm('Are you sure you want to delete this work location?')) {
      this.locationService.deleteLocation(id).subscribe(() => {
        this.loadLocations(); // Recargar la lista después de borrar
      });
    }
  }
}
