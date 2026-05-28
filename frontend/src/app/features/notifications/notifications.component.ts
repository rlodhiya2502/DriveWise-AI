import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2><mat-icon>notifications</mat-icon> Notifications</h2>
        <span class="unread-badge" *ngIf="unreadCount">{{ unreadCount }} unread</span>
      </div>

      <mat-card>
        <mat-card-content>
          <div *ngIf="notifications.length === 0" class="empty-state">
            <mat-icon>notifications_none</mat-icon>
            <p>No notifications yet.</p>
          </div>
          <div *ngFor="let n of notifications" class="notif-row" [class.unread]="!n.read_at">
            <div class="notif-icon">
              <mat-icon>{{ iconFor(n.type) }}</mat-icon>
            </div>
            <div class="notif-body">
              <p class="notif-message">{{ n.message }}</p>
              <span class="notif-meta">
                <mat-icon>{{ n.channel === 'whatsapp' ? 'chat' : 'email' }}</mat-icon>
                {{ n.channel }} · {{ n.sent_at | date:'d MMM yyyy, HH:mm' }}
              </span>
            </div>
            <button mat-icon-button *ngIf="!n.read_at" (click)="markRead(n)" title="Mark read">
              <mat-icon>done</mat-icon>
            </button>
            <mat-icon *ngIf="n.read_at" class="read-icon">check_circle</mat-icon>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { max-width: 800px; margin: 0 auto; padding: 24px; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .unread-badge { background: #e53935; color: white; border-radius: 12px;
      padding: 2px 10px; font-size: 12px; font-weight: 700; }
    .notif-row { display: flex; align-items: flex-start; gap: 12px; padding: 16px 0;
      border-bottom: 1px solid #f0f0f0; }
    .notif-row.unread { background: #fffde7; border-radius: 8px; padding: 16px 12px; margin: 4px 0; }
    .notif-icon mat-icon { font-size: 28px; width: 28px; height: 28px; color: #1976d2; }
    .notif-body { flex: 1; }
    .notif-message { margin: 0 0 4px; font-size: 14px; white-space: pre-line; }
    .notif-meta { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #999; }
    .notif-meta mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .read-icon { color: #a5d6a7; margin: auto 8px; }
    .empty-state { text-align: center; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; display: block; margin: 0 auto 12px; }
  `],
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  get unreadCount(): number { return this.notifications.filter(n => !n.read_at).length; }

  constructor(private svc: NotificationService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.svc.getAll().subscribe(({ notifications }) => this.notifications = notifications);
  }

  markRead(n: Notification): void {
    this.svc.markRead(n.id).subscribe(() => {
      n.read_at = new Date().toISOString();
      this.snack.open('Marked as read', undefined, { duration: 1500 });
    });
  }

  iconFor(type: string): string {
    const map: Record<string, string> = {
      lesson_booked: 'event', lesson_reminder: 'alarm', lesson_cancelled: 'cancel',
      milestone: 'emoji_events', custom: 'message',
    };
    return map[type] ?? 'notifications';
  }
}
