import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { Insights } from '../../core/models/models';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressBarModule, MatSnackBarModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2><mat-icon>insights</mat-icon> Performance Insights</h2>
        <button mat-raised-button color="accent" (click)="loadInsights()" [disabled]="loading">
          <mat-icon>auto_awesome</mat-icon> {{ loading ? 'Analysing…' : 'Refresh AI Analysis' }}
        </button>
      </div>

      <div *ngIf="!insights && !loading" class="empty-state">
        <mat-icon>bar_chart</mat-icon>
        <h3>No insights yet</h3>
        <p>Complete at least one lesson with feedback to generate AI performance insights.</p>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        <p>AI is analysing your lesson data…</p>
      </div>

      <div *ngIf="insights" class="insights-grid">
        <!-- Pass probability -->
        <mat-card class="prob-card">
          <mat-card-content>
            <div class="prob-circle" [style.background]="probGradient">
              <span class="prob-value">{{ insights.passProbability }}%</span>
              <span class="prob-label">Pass Probability</span>
            </div>
            <mat-progress-bar mode="determinate" [value]="insights.passProbability"
              [color]="insights.passProbability >= 70 ? 'primary' : 'warn'">
            </mat-progress-bar>
          </mat-card-content>
        </mat-card>

        <!-- Summary -->
        <mat-card class="summary-card">
          <mat-card-header>
            <mat-card-title><mat-icon>summarize</mat-icon> Summary</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>{{ insights.summary }}</p>
          </mat-card-content>
        </mat-card>

        <!-- Strengths -->
        <mat-card>
          <mat-card-header>
            <mat-card-title style="color:#43a047"><mat-icon>star</mat-icon> Strengths</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chips-wrap">
              <mat-chip *ngFor="let s of insights.strengths" style="background:#e8f5e9">
                ✅ {{ s }}
              </mat-chip>
            </div>
            <p *ngIf="!insights.strengths?.length" class="muted">Keep practising to build strengths!</p>
          </mat-card-content>
        </mat-card>

        <!-- Weak areas -->
        <mat-card>
          <mat-card-header>
            <mat-card-title style="color:#e53935"><mat-icon>warning</mat-icon> Areas to Improve</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chips-wrap">
              <mat-chip *ngFor="let a of insights.weakAreas" style="background:#fce4ec">
                ⚠️ {{ a }}
              </mat-chip>
            </div>
            <p *ngIf="!insights.weakAreas?.length" class="muted">Great — no major weak areas found!</p>
          </mat-card-content>
        </mat-card>

        <!-- Recommendations -->
        <mat-card class="full-width">
          <mat-card-header>
            <mat-card-title><mat-icon>lightbulb</mat-icon> AI Recommendations</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div *ngFor="let r of insights.recommendations; let i = index" class="recommendation">
              <div class="rec-num">{{ i + 1 }}</div>
              <p>{{ r }}</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1100px; margin: 0 auto; padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .empty-state { text-align: center; padding: 64px; color: #999; }
    .empty-state mat-icon { font-size: 80px; width: 80px; height: 80px; display: block; margin: 0 auto 16px; }
    .loading { padding: 24px; text-align: center; color: #666; }
    .insights-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .full-width { grid-column: 1 / -1; }
    .prob-card { text-align: center; }
    .prob-circle { width: 140px; height: 140px; border-radius: 50%; margin: 16px auto;
      display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .prob-value { font-size: 36px; font-weight: 700; color: white; }
    .prob-label { font-size: 12px; color: rgba(255,255,255,0.85); }
    .chips-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
    .muted { color: #999; font-size: 13px; }
    .recommendation { display: flex; gap: 12px; align-items: flex-start; margin: 12px 0; }
    .rec-num { width: 28px; height: 28px; border-radius: 50%; background: #1976d2;
      color: white; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; flex-shrink: 0; }
    .recommendation p { margin: 0; line-height: 1.5; }
  `],
})
export class InsightsComponent implements OnInit {
  insights: Insights | null = null;
  loading = false;

  get probGradient(): string {
    const p = this.insights?.passProbability ?? 0;
    return p >= 70 ? 'linear-gradient(135deg,#43a047,#66bb6a)'
      : p >= 40 ? 'linear-gradient(135deg,#fb8c00,#ffa726)'
      : 'linear-gradient(135deg,#e53935,#ef5350)';
  }

  constructor(private studentSvc: StudentService, private auth: AuthService, private snack: MatSnackBar) {}

  ngOnInit(): void { this.loadInsights(); }

  loadInsights(): void {
    const user = this.auth.currentUser;
    if (!user) return;
    // For simplicity, student ID = user ID mapping (in real app, resolve from profile)
    this.loading = true;
    this.studentSvc.getInsights(user.id).subscribe({
      next: ({ insights }) => { this.insights = insights; this.loading = false; },
      error: () => { this.loading = false;
        this.snack.open('Could not load insights', 'OK', { duration: 2000 }); },
    });
  }
}
