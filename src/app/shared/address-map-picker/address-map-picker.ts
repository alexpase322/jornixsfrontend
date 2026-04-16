import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  signal,
  OnChanges,
  SimpleChanges,
  NgZone,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';

export interface AddressSelection {
  address: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-address-map-picker',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  template: `
    <div class="space-y-3">
      <!-- Address input with autocomplete -->
      <div>
        <label class="block text-gray-300 text-sm font-bold mb-2">{{ label }}</label>
        <input
          #addressInput
          type="text"
          class="form-input"
          [placeholder]="placeholder"
          [value]="displayAddress()"
          (input)="onAddressInput($event)"
        >
      </div>

      <!-- Map (only render on browser to avoid SSR errors) -->
      <div *ngIf="isBrowser" class="rounded-lg overflow-hidden border border-gray-600" style="height: 300px;">
        <google-map
          #googleMap
          width="100%"
          height="300px"
          [center]="mapCenter()"
          [zoom]="mapZoom()"
          [options]="mapOptions"
        >
          <map-marker
            [position]="markerPosition()"
            [options]="markerOptions"
            (mapDragend)="onMarkerDragEnd($event)"
          />
        </google-map>
      </div>

      <!-- Coordinates display -->
      <div *ngIf="isBrowser && markerPosition().lat !== 0" class="flex gap-4 text-xs text-gray-400">
        <span>Lat: {{ markerPosition().lat | number:'1.6-6' }}</span>
        <span>Lng: {{ markerPosition().lng | number:'1.6-6' }}</span>
      </div>
    </div>
  `
})
export class AddressMapPickerComponent implements AfterViewInit, OnChanges {
  @ViewChild('addressInput') addressInput!: ElementRef<HTMLInputElement>;
  @ViewChild('googleMap') googleMap!: GoogleMap;

  @Input() label = 'Address';
  @Input() placeholder = 'Search for an address...';
  @Input() initialLatitude: number | null = null;
  @Input() initialLongitude: number | null = null;
  @Input() initialAddress = '';

  @Output() addressSelected = new EventEmitter<AddressSelection>();

  displayAddress = signal('');
  mapCenter = signal<{ lat: number; lng: number }>({ lat: 37.7749, lng: -122.4194 });
  mapZoom = signal(12);
  markerPosition = signal<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

  isBrowser: boolean;

  mapOptions: any = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] }
    ]
  };

  markerOptions: any = {
    draggable: true
  };

  private autocomplete: any = null;
  private geocoder: any = null;

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    // Skip Google Maps initialization during SSR
    if (!this.isBrowser) return;

    // Wait for Google Maps API to be loaded
    this.waitForGoogleMaps().then(() => {
      this.initAutocomplete();
      this.geocoder = new (window as any).google.maps.Geocoder();

      if (this.initialLatitude && this.initialLongitude) {
        this.setPosition(this.initialLatitude, this.initialLongitude);
        this.displayAddress.set(this.initialAddress);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['initialLatitude'] || changes['initialLongitude']) &&
      this.initialLatitude && this.initialLongitude
    ) {
      this.setPosition(this.initialLatitude, this.initialLongitude);
    }
    if (changes['initialAddress'] && this.initialAddress) {
      this.displayAddress.set(this.initialAddress);
    }
  }

  private async waitForGoogleMaps(): Promise<void> {
    const maxAttempts = 50;
    let attempts = 0;
    while (
      attempts < maxAttempts &&
      (typeof (window as any).google === 'undefined' ||
        !(window as any).google.maps ||
        !(window as any).google.maps.places)
    ) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  private initAutocomplete(): void {
    if (!this.isBrowser || !this.addressInput?.nativeElement) return;
    const google = (window as any).google;
    if (!google?.maps?.places) return;

    this.autocomplete = new google.maps.places.Autocomplete(
      this.addressInput.nativeElement,
      { types: ['address'] }
    );

    this.autocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = this.autocomplete.getPlace();
        if (!place.geometry?.location) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || '';

        this.setPosition(lat, lng);
        this.displayAddress.set(address);
        this.mapZoom.set(16);

        this.addressSelected.emit({ address, latitude: lat, longitude: lng });
      });
    });
  }

  onAddressInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.displayAddress.set(value);
  }

  onMarkerDragEnd(event: any): void {
    if (!this.isBrowser || !event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    this.setPosition(lat, lng);

    if (this.geocoder) {
      this.geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        this.ngZone.run(() => {
          if (status === 'OK' && results && results[0]) {
            const address = results[0].formatted_address;
            this.displayAddress.set(address);
            if (this.addressInput?.nativeElement) {
              this.addressInput.nativeElement.value = address;
            }
            this.addressSelected.emit({ address, latitude: lat, longitude: lng });
          } else {
            this.addressSelected.emit({ address: this.displayAddress(), latitude: lat, longitude: lng });
          }
        });
      });
    }
  }

  private setPosition(lat: number, lng: number): void {
    const pos = { lat, lng };
    this.mapCenter.set(pos);
    this.markerPosition.set(pos);
  }
}
