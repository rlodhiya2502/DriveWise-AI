import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSidenavModule, MatToolbarModule,
    MatListModule, MatIconModule, MatButtonModule, MatBadgeModule],
  template: `
    <div *ngIf="!isLoggedIn">
      <router-outlet></router-outlet>
    </div>

    <mat-sidenav-container *ngIf="isLoggedIn" class="app-container">
      <mat-sidenav #sidenav mode="side" opened class="sidenav">
        <div class="brand">
          <span class="brand-icon">🚗</span>
          <span class="brand-name">DriveWise AI</span>
        </div>

        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/scheduling" routerLinkActive="active">
            <mat-icon matListItemIcon>event</mat-icon>
            <span matListItemTitle>Scheduling</span>
          </a>
          <a mat-list-item routerLink="/students" routerLinkActive="active" *ngIf="!isStudent">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>Students</span>
          </a>
          <a mat-list-item routerLink="/instructors" routerLinkActive="active">
            <mat-icon matListItemIcon>supervisor_account</mat-icon>
            <span matListItemTitle>Instructors</span>
          </a>
          <a mat-list-item routerLink="/routes" routerLinkActive="active">
            <mat-icon matListItemIcon>map</mat-icon>
            <span matListItemTitle>Routes</span>
          </a>
          <a mat-list-item routerLink="/insights" routerLinkActive="active">
            <mat-icon matListItemIcon>insights</mat-icon>
            <span matListItemTitle>Insights</span>
          </a>
          <a mat-list-item routerLink="/notifications" routerLinkActive="active">
            <mat-icon matListItemIcon [matBadge]="unreadCount || null" matBadgeColor="warn">notifications</mat-icon>
            <span matListItemTitle>Notifications</span>
          </a>
          <a mat-list-item routerLink="/admin" routerLinkActive="active" *ngIf="isAdmin">
            <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
            <span matListItemTitle>Admin</span>
          </a>
        </mat-nav-list>

        <div class="user-footer">
          <img [src]="user?.avatar || 'assets/default-avatar.png'" class="user-avatar" alt="avatar">
          <div class="user-info">
            <strong>{{ user?.name }}</strong>
            <small>{{ user?.role | titlecase }}</small>
          </div>
          <button mat-icon-button (click)="logout()" title="Sign out">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="main-content">
        <mat-toolbar color="primary" class="top-bar">
          <button mat-icon-button (click)="sidenav.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="toolbar-title">DriveWise AI</span>
        </mat-toolbar>
        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .app-container { height: 100vh; }
    .sidenav { width: 240px; display: flex; flex-direction: column; background: #1a237e; color: white; }
    .brand { display: flex; align-items: center; gap: 10px; padding: 20px 16px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.15); }
    .brand-icon { font-size: 28px; }
    .brand-name { font-size: 18px; font-weight: 700; color: white; }
    mat-nav-list { flex: 1; padding-top: 8px; }
    mat-nav-list a { color: rgba(255,255,255,0.8); border-radius: 8px; margin: 2px 8px; }
    mat-nav-list a:hover, mat-nav-list a.active { background: rgba(255,255,255,0.15); color: white; }
    mat-nav-list a.active { background: rgba(255,255,255,0.2); }
    .user-footer { display: flex; align-items: center; gap: 10px; padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.2); }
    .user-avatar { width: 36px; height: 36px; border-radius: 50%; }
    .user-info { flex: 1; display: flex; flex-direction: column; }
    .user-info strong { font-size: 13px; color: white; }
    .user-info small { font-size: 11px; color: rgba(255,255,255,0.6); }
    .user-footer button { color: rgba(255,255,255,0.7); }
    .top-bar { position: sticky; top: 0; z-index: 10; }
    .toolbar-title { margin-left: 8px; font-size: 18px; }
    .content-area { padding: 0; min-height: calc(100vh - 64px); }
    .main-content { display: flex; flex-direction: column; }
  `],
})
export class App implements OnInit {
  private authSvc = inject(AuthService);
  private notifSvc = inject(NotificationService);
  private router = inject(Router);

  user = this.authSvc.currentUser;
  unreadCount = 0;
  get isLoggedIn(): boolean { return this.authSvc.isLoggedIn; }
  get isStudent(): boolean { return this.authSvc.isStudent; }
  get isAdmin(): boolean { return this.authSvc.isAdmin; }

  constructor() {}

  ngOnInit(): void {
    this.authSvc.currentUser$.subscribe(u => { this.user = u; });
    if (this.isLoggedIn) {
      this.notifSvc.getAll().subscribe(({ notifications }) => {
        this.unreadCount = notifications.filter(n => !n.read_at).length;
      });
    }
  }

  logout(): void { this.authSvc.logout(); }
}
