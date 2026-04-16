import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private nextId = 0;
  public notifications = signal<Notification[]>([]);

  show(message: string, type: NotificationType = 'info', durationMs = 5000): void {
    const id = this.nextId++;
    const notification: Notification = { id, message, type };

    this.notifications.update(list => [...list, notification]);

    if (durationMs > 0) {
      setTimeout(() => this.dismiss(id), durationMs);
    }
  }

  success(message: string, durationMs = 5000): void {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs = 7000): void {
    this.show(message, 'error', durationMs);
  }

  warning(message: string, durationMs = 5000): void {
    this.show(message, 'warning', durationMs);
  }

  info(message: string, durationMs = 5000): void {
    this.show(message, 'info', durationMs);
  }

  dismiss(id: number): void {
    this.notifications.update(list => list.filter(n => n.id !== id));
  }

  clear(): void {
    this.notifications.set([]);
  }
}
