import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <div class="logo">🚗</div>
          <mat-card-title>DriveWise AI</mat-card-title>
          <mat-card-subtitle>Intelligent Driving School Management</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <p class="welcome-text">Sign in to continue</p>
          <div *ngIf="loading" class="spinner-wrap">
            <mat-spinner diameter="36"></mat-spinner>
          </div>
          <div *ngIf="error" class="error-msg">{{ error }}</div>
          <div id="google-btn" class="google-btn-container"></div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
    }
    .login-card { width: 380px; text-align: center; padding: 32px; border-radius: 16px; }
    .logo { font-size: 64px; margin-bottom: 8px; }
    mat-card-title { font-size: 28px; font-weight: 700; }
    mat-card-subtitle { font-size: 14px; margin-top: 4px; }
    .welcome-text { color: #666; margin: 24px 0 16px; }
    .google-btn-container { display: flex; justify-content: center; margin-top: 16px; }
    .spinner-wrap { display: flex; justify-content: center; margin: 16px 0; }
    .error-msg { color: #e53935; font-size: 13px; margin-bottom: 12px; }
  `],
})
export class LoginComponent implements OnInit {
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadGoogleScript();
  }

  private loadGoogleScript(): void {
    if (typeof google !== 'undefined') {
      this.initGoogleSignIn();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.initGoogleSignIn();
    document.head.appendChild(script);
  }

  private initGoogleSignIn(): void {
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.handleCredential(response),
    });
    google.accounts.id.renderButton(document.getElementById('google-btn'), {
      theme: 'outline', size: 'large', text: 'continue_with', width: 280,
    });
  }

  private handleCredential(response: any): void {
    this.loading = true;
    this.error = '';
    this.auth.loginWithGoogle(response.credential).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error ?? 'Login failed. Please try again.';
      },
    });
  }
}
