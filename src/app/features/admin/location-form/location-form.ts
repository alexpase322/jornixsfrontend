import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WorkLocationService } from '../../../core/services/work-location';

@Component({
  selector: 'app-location-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './location-form.html',
})
export class LocationForm implements OnInit {
  locationForm: FormGroup;
  isEditMode = signal(false);
  private locationId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private locationService: WorkLocationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.locationForm = this.fb.group({
      name: ['', Validators.required],
      address: [''],
      latitude: ['', Validators.required],
      longitude: ['', Validators.required],
      geofenceRadiusMeters: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.locationId = Number(id);
      this.locationService.getLocationById(this.locationId).subscribe(location => {
        this.locationForm.patchValue(location);
      });
    }
  }

  onSubmit(): void {
    if (this.locationForm.invalid) {
      return;
    }

    const formData = this.locationForm.value;
    const action = this.isEditMode()
      ? this.locationService.updateLocation(this.locationId!, formData)
      : this.locationService.createLocation(formData);

    action.subscribe(() => {
      this.router.navigate(['/admin/locations']);
    });
  }
}