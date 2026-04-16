import { Component, inject } from '@angular/core';
import { NotificationService } from '../../core/services/notification';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      @for (notification of notificationService.notifications(); track notification.id) {
        <div
          class="rounded-lg px-4 py-3 shadow-lg text-sm font-medium flex items-center justify-between gap-3 animate-slide-in"
          [class]="getClasses(notification.type)"
          role="alert"
        >
          <span>{{ notification.message }}</span>
          <button
            (click)="notificationService.dismiss(notification.id)"
            class="text-current opacity-70 hover:opacity-100 shrink-0"
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>
      }
    </div>
  `
})
export class NotificationContainerComponent {
  notificationService = inject(NotificationService);

  getClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
      default:
        return 'bg-blue-500 text-white';
    }
  }
}
