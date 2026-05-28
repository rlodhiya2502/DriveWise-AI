import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../core/services/auth.service';
import { LessonService } from '../../core/services/lesson.service';
import { StudentService } from '../../core/services/student.service';
import { NotificationService } from '../../core/services/notification.service';
import { Lesson, Notification, LearningPlan } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressBarModule],
  template: `
    <div class="dashboard">
      <div class="welcome-banner">
        <img *ngIf="user?.avatar" [src]="user!.avatar" class="avatar" alt="avatar">
        <div>
          <h1>Welcome back, {{ user?.name?.split(' ')?.[0] }}! 👋</h1>
          <p class="role-badge">{{ user?.role | titlecase }}</p>
        </div>
      </div>

      <!-- Stats row -->
      <div class="stats-row">
        <mat-card class="stat-card">
          <mat-icon color="primary">event</mat-icon>
          <div class="stat-value">{{ upcomingLessons.length }}</div>
          <div class="stat-label">Upcoming Lessons</div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon color="accent">check_circle</mat-icon>
          <div class="stat-value">{{ completedLessons.length }}</div>
          <div class="stat-label">Completed Lessons</div>
        </mat-card>
        <mat-card class="stat-card" *ngIf="plan">
          <mat-icon color="warn">trending_up</mat-icon>
          <div class="stat-value">{{ plan.totalLessons }}</div>
          <div class="stat-label">Planned Lessons</div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon>notifications</mat-icon>
          <div class="stat-value">{{ unreadCount }}</div>
          <div class="stat-label">Notifications</div>
        </mat-card>
      </div>

      <!-- Upcoming lessons -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title><mat-icon>event_note</mat-icon> Upcoming Lessons</mat-card-title>
          <button mat-button color="primary" routerLink="/scheduling">View All</button>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="upcomingLessons.length === 0" class="empty-state">No upcoming lessons scheduled.</div>
          <div *ngFor="let lesson of upcomingLessons.slice(0,3)" class="lesson-row">
            <mat-icon>directions_car</mat-icon>
            <div class="lesson-info">
              <strong>{{ lesson.topic }}</strong>
              <span>{{ lesson.scheduled_at | date:'EEE, d MMM yyyy HH:mm' }}</span>
              <span *ngIf="lesson.instructor_name">with {{ lesson.instructor_name }}</span>
              <span *ngIf="lesson.student_name">— {{ lesson.student_name }}</span>
            </div>
            <mat-chip [ngClass]="lesson.status">{{ lesson.status }}</mat-chip>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Learning plan (students only) -->
      <mat-card class="section-card" *ngIf="isStudent && plan">
        <mat-card-header>
          <mat-card-title><mat-icon>auto_awesome</mat-icon> Your AI Learning Plan</mat-card-title>
          <button mat-button color="primary" routerLink="/students">View Details</button>
        </mat-card-header>
        <mat-card-content>
          <p>{{ plan.notes }}</p>
          <div class="focus-areas">
            <mat-chip *ngFor="let area of plan.focusAreas" color="primary" selected>{{ area }}</mat-chip>
          </div>
          <div *ngFor="let ms of plan.milestones" class="milestone">
            <span>{{ ms.title }}</span>
            <mat-progress-bar mode="determinate" [value]="getMilestoneProgress(ms)"></mat-progress-bar>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Quick actions -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title><mat-icon>flash_on</mat-icon> Quick Actions</mat-card-title>
        </mat-card-header>
        <mat-card-content class="quick-actions">
          <button mat-raised-button color="primary" routerLink="/scheduling">
            <mat-icon>add</mat-icon> Book Lesson
          </button>
          <button mat-raised-button color="accent" routerLink="/routes">
            <mat-icon>map</mat-icon> View Routes
          </button>
          <button mat-raised-button routerLink="/insights">
            <mat-icon>insights</mat-icon> My Insights
          </button>
          <button mat-raised-button *ngIf="isAdmin" routerLink="/admin">
            <mat-icon>admin_panel_settings</mat-icon> Admin Portal
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1100px; margin: 0 auto; padding: 24px; }
    .welcome-banner { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .avatar { width: 64px; height: 64px; border-radius: 50%; }
    h1 { margin: 0; font-size: 26px; }
    .role-badge { margin: 4px 0 0; color: #666; font-size: 13px; }
    .stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { padding: 20px; text-align: center; }
    .stat-card mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .stat-value { font-size: 36px; font-weight: 700; }
    .stat-label { color: #666; font-size: 13px; }
    .section-card { margin-bottom: 24px; }
    .section-card mat-card-header { display: flex; justify-content: space-between; align-items: center; }
    mat-card-title { display: flex; align-items: center; gap: 8px; font-size: 18px; }
    .lesson-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
    .lesson-info { flex: 1; display: flex; flex-direction: column; font-size: 14px; }
    .lesson-info strong { font-size: 15px; }
    .lesson-info span { color: #666; }
    .empty-state { color: #999; padding: 16px 0; }
    .focus-areas { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
    .milestone { margin: 12px 0; }
    .milestone span { font-size: 13px; color: #555; display: block; margin-bottom: 4px; }
    .quick-actions { display: flex; flex-wrap: wrap; gap: 12px; padding-top: 8px; }
    mat-chip.scheduled { background: #e3f2fd; }
    mat-chip.completed { background: #e8f5e9; }
    mat-chip.cancelled { background: #fce4ec; }
  `],
})
export class DashboardComponent implements OnInit {
  private authSvc = inject(AuthService);
  private lessonSvc = inject(LessonService);
  private studentSvc = inject(StudentService);
  private notifSvc = inject(NotificationService);

  user = this.authSvc.currentUser;
  isStudent = this.authSvc.isStudent;
  isAdmin = this.authSvc.isAdmin;
  upcomingLessons: Lesson[] = [];
  completedLessons: Lesson[] = [];
  plan: LearningPlan | null = null;
  unreadCount = 0;

  constructor() {}

  ngOnInit(): void {
    this.lessonSvc.getAll().subscribe(({ lessons }) => {
      const now = new Date();
      this.upcomingLessons = lessons.filter(l => l.status === 'scheduled' && new Date(l.scheduled_at) >= now);
      this.completedLessons = lessons.filter(l => l.status === 'completed');
    });
    this.notifSvc.getAll().subscribe(({ notifications }) => {
      this.unreadCount = notifications.filter(n => !n.read_at).length;
    });
  }

  getMilestoneProgress(ms: any): number {
    if (!this.completedLessons.length) return 0;
    return Math.min(100, Math.round((this.completedLessons.length / ms.lessonsRequired) * 100));
  }
}
