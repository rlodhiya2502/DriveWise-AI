import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { InstructorService } from '../../core/services/instructor.service';
import { AuthService } from '../../core/services/auth.service';
import { Instructor, InstructorMatch } from '../../core/models/models';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-instructors',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressBarModule, MatSnackBarModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2><mat-icon>supervisor_account</mat-icon> Instructors</h2>
      </div>

      <div class="instructors-grid">
        <mat-card *ngFor="let inst of instructors" class="inst-card">
          <mat-card-header>
            <img mat-card-avatar [src]="inst.avatar || 'assets/default-avatar.png'" alt="avatar">
            <mat-card-title>{{ inst.name }}</mat-card-title>
            <mat-card-subtitle>{{ inst.vehicle_type | titlecase }} · ⭐ {{ inst.rating | number:'1.1-1' }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p class="bio">{{ inst.bio || 'No bio provided.' }}</p>
            <div class="chips-wrap">
              <mat-chip *ngFor="let spec of inst.specialisations" color="primary" selected>{{ spec }}</mat-chip>
            </div>
            <div class="stat-row">
              <mat-icon>check_circle</mat-icon>
              <span>{{ inst.completed_lessons || 0 }} lessons completed</span>
            </div>
            <mat-progress-bar mode="determinate" [value]="inst.rating * 20"></mat-progress-bar>
          </mat-card-content>
        </mat-card>
      </div>

      <div *ngIf="instructors.length === 0" class="empty-state">
        <mat-icon>supervisor_account</mat-icon>
        <p>No instructors found.</p>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1100px; margin: 0 auto; padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .instructors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .inst-card { transition: box-shadow 0.2s; }
    .inst-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
    .bio { color: #555; font-size: 13px; margin: 8px 0; }
    .chips-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
    .stat-row { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #666; margin: 8px 0; }
    .empty-state { text-align: center; padding: 64px; color: #999; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; display: block; margin: 0 auto 12px; }
  `],
})
export class InstructorsComponent implements OnInit {
  instructors: Instructor[] = [];

  constructor(private svc: InstructorService, private auth: AuthService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.svc.getAll().subscribe(({ instructors }) => {
      this.instructors = instructors.map(i => ({
        ...i,
        specialisations: typeof i.specialisations === 'string'
          ? JSON.parse(i.specialisations as any) : i.specialisations ?? [],
      }));
    });
  }
}
