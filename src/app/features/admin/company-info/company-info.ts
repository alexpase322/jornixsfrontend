import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyService } from '../../../core/services/company';
import { PaymentService } from '../../../core/services/payment';
import { NotificationService } from '../../../core/services/notification';
import { CompanyInfo } from '../../../core/models/company.models';
import { ModalComponent } from '../../../shared/modal/modal';

@Component({
  selector: 'app-company-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './company-info.html'
})
export class CompanyInfoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private paymentService = inject(PaymentService);
  private notificationService = inject(NotificationService);

  companyForm: FormGroup;
  companyInfo = signal<CompanyInfo | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  isUploadingLogo = signal(false);
  isLoadingPortal = signal(false);
  isCanceling = signal(false);
  showCancelModal = signal(false);

  constructor() {
    this.companyForm = this.fb.group({
      companyName: ['', Validators.required],
      address: [''],
      phoneNumber: ['']
    });
  }

  ngOnInit(): void {
    this.loadCompanyInfo();
  }

  private loadCompanyInfo(): void {
    this.isLoading.set(true);
    this.companyService.getCompanyInfo().subscribe({
      next: info => {
        this.companyInfo.set(info);
        this.companyForm.patchValue({
          companyName: info.companyName,
          address: info.address,
          phoneNumber: info.phoneNumber
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.error('Error loading company info');
        this.isLoading.set(false);
      }
    });
  }

  onSave(): void {
    if (this.companyForm.invalid) return;
    this.isSaving.set(true);
    this.companyService.updateCompanyInfo(this.companyForm.value).subscribe({
      next: info => {
        this.companyInfo.set(info);
        this.notificationService.success('Company info updated');
        this.isSaving.set(false);
      },
      error: err => {
        this.notificationService.error(err.error?.message || 'Error updating company');
        this.isSaving.set(false);
      }
    });
  }

  async onLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.notificationService.error('Only image files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.error('Image must be smaller than 5MB');
      return;
    }

    this.isUploadingLogo.set(true);
    this.companyService.uploadLogo(file).subscribe({
      next: response => {
        this.companyInfo.update(info => info ? { ...info, logoUrl: response.logoUrl } : info);
        this.notificationService.success('Logo updated successfully');
        this.isUploadingLogo.set(false);
      },
      error: err => {
        this.notificationService.error(err.error?.message || 'Error uploading logo');
        this.isUploadingLogo.set(false);
      }
    });

    // Clear input so same file can be selected again
    input.value = '';
  }

  manageBilling(): void {
    this.isLoadingPortal.set(true);
    this.paymentService.createPortalSession().subscribe({
      next: response => {
        window.location.href = response.url;
      },
      error: err => {
        this.notificationService.error(err.error?.message || 'Error opening billing portal');
        this.isLoadingPortal.set(false);
      }
    });
  }

  openCancelModal(): void {
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
  }

  confirmCancelSubscription(): void {
    this.isCanceling.set(true);
    this.paymentService.cancelSubscription().subscribe({
      next: () => {
        this.notificationService.success('Subscription canceled. Will remain active until the end of the billing period.');
        this.showCancelModal.set(false);
        this.isCanceling.set(false);
        this.loadCompanyInfo();
      },
      error: err => {
        this.notificationService.error(err.error?.message || 'Error canceling subscription');
        this.isCanceling.set(false);
      }
    });
  }

  getStatusBadgeClass(status: string | null): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'TRIALING':
        return 'bg-blue-100 text-blue-800';
      case 'PAST_DUE':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
