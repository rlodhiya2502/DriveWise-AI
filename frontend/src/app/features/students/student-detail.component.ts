import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { StudentService } from '../../core/services/student.service';
import { InstructorService } from '../../core/services/instructor.service';
import { Student, LearningPlan, Insights, Instructor } from '../../core/models/models';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressBarModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatSnackBarModule, MatTabsModule],
  template: `
    <div class="page-container" *ngIf="student">
      <div class="profile-header">
        <img [src]="student.avatar || 'assets/default-avatar.png'" class="avatar" alt="avatar">
        <div>
          <h2>{{ student.name }}</h2>
          <p>{{ student.email }}</p>
          <mat-chip [class]="student.skill_level">{{ student.skill_level | titlecase }}</mat-chip>
        </div>
      </div>

      <mat-tab-group>
        <!-- Profile tab -->
        <mat-tab label="Profile">
          <mat-card class="tab-card">
            <mat-card-content>
              <div class="form-grid">
                <mat-form-field>
                  <mat-label>Skill Level</mat-label>
                  <mat-select [(ngModel)]="student.skill_level">
                    <mat-option value="beginner">Beginner</mat-option>
                    <mat-option value="intermediate">Intermediate</mat-option>
                    <mat-option value="advanced">Advanced</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Learning Pace</mat-label>
                  <mat-select [(ngModel)]="student.learning_pace">
                    <mat-option value="slow">Slow</mat-option>
                    <mat-option value="average">Average</mat-option>
                    <mat-option value="fast">Fast</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Test Date</mat-label>
                  <input matInput type="date" [(ngModel)]="student.test_date">
                </mat-form-field>
                <mat-form-field>
                  <mat-label>WhatsApp Number</mat-label>
                  <input matInput [(ngModel)]="student.whatsapp_number" placeholder="+447700900000">
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Preferred Instructor</mat-label>
                  <mat-select [(ngModel)]="student.preferred_instructor_id">
                    <mat-option [value]="null">No preference</mat-option>
                    <mat-option *ngFor="let i of instructors" [value]="i.id">{{ i.name }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <button mat-raised-button color="primary" (click)="saveProfile()">Save Changes</button>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <!-- Learning Plan tab -->
        <mat-tab label="AI Learning Plan">
          <mat-card class="tab-card">
            <mat-card-content>
              <div *ngIf="!plan" class="empty-state">
                <p>No learning plan yet.</p>
                <button mat-raised-button color="primary" (click)="generatePlan()" [disabled]="generatingPlan">
                  <mat-icon>auto_awesome</mat-icon>
                  {{ generatingPlan ? 'Generating...' : 'Generate AI Plan' }}
                </button>
              </div>
              <div *ngIf="plan">
                <div class="plan-summary">
                  <div class="plan-stat"><strong>{{ plan.totalLessons }}</strong><span>Total Lessons</span></div>
                  <div class="plan-stat"><strong>{{ plan.weeklyFrequency }}x</strong><span>Per Week</span></div>
                  <div class="plan-stat"><strong>{{ plan.focusAreas?.length }}</strong><span>Focus Areas</span></div>
                </div>
                <p class="plan-notes">{{ plan.notes }}</p>
                <div class="focus-chips">
                  <mat-chip *ngFor="let area of plan.focusAreas" color="primary" selected>{{ area }}</mat-chip>
                </div>
                <h4>Milestones</h4>
                <div *ngFor="let ms of plan.milestones" class="milestone">
                  <div class="milestone-header">
                    <span>{{ ms.title }}</span>
                    <small>{{ ms.lessonsRequired }} lessons</small>
                  </div>
                  <mat-progress-bar mode="determinate" [value]="0"></mat-progress-bar>
                  <div class="ms-topics">
                    <mat-chip *ngFor="let t of ms.topics">{{ t }}</mat-chip>
                  </div>
                </div>
                <button mat-stroked-button (click)="generatePlan()" [disabled]="generatingPlan">
                  <mat-icon>refresh</mat-icon> Regenerate Plan
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <!-- Insights tab -->
        <mat-tab label="Performance Insights">
          <mat-card class="tab-card">
            <mat-card-content>
              <div *ngIf="!insights" class="empty-state">
                <p>Complete at least one lesson to see insights.</p>
                <button mat-raised-button color="accent" (click)="loadInsights()">
                  <mat-icon>refresh</mat-icon> Load Insights
                </button>
              </div>
              <div *ngIf="insights">
                <div class="insights-summary">
                  <div class="pass-prob">
                    <div class="prob-circle" [style.background]="probColor">
                      {{ insights.passProbability }}%
                    </div>
                    <span>Estimated Pass Probability</span>
                  </div>
                </div>
                <p><strong>Summary:</strong> {{ insights.summary }}</p>
                <div class="insight-section">
                  <h4 style="color: #e53935"><mat-icon>warning</mat-icon> Areas to Improve</h4>
                  <mat-chip *ngFor="let a of insights.weakAreas" style="background:#fce4ec">{{ a }}</mat-chip>
                </div>
                <div class="insight-section">
                  <h4 style="color: #43a047"><mat-icon>star</mat-icon> Strengths</h4>
                  <mat-chip *ngFor="let s of insights.strengths" style="background:#e8f5e9">{{ s }}</mat-chip>
                </div>
                <div class="insight-section">
                  <h4><mat-icon>lightbulb</mat-icon> Recommendations</h4>
                  <ul><li *ngFor="let r of insights.recommendations">{{ r }}</li></ul>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 24px; }
    .profile-header { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
    .avatar { width: 80px; height: 80px; border-radius: 50%; }
    h2 { margin: 0; font-size: 24px; }
    .tab-card { margin-top: 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .empty-state { text-align: center; padding: 32px; color: #666; }
    .plan-summary { display: flex; gap: 24px; margin-bottom: 20px; }
    .plan-stat { display: flex; flex-direction: column; align-items: center; }
    .plan-stat strong { font-size: 28px; font-weight: 700; color: #1976d2; }
    .plan-stat span { font-size: 12px; color: #666; }
    .plan-notes { color: #555; font-style: italic; margin: 16px 0; }
    .focus-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .milestone { margin: 12px 0; padding: 12px; background: #fafafa; border-radius: 8px; }
    .milestone-header { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }
    .ms-topics { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .insights-summary { display: flex; justify-content: center; margin: 20px 0; }
    .pass-prob { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .prob-circle { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center;
      justify-content: center; font-size: 24px; font-weight: 700; color: white; }
    .insight-section { margin: 16px 0; }
    .insight-section h4 { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
    mat-chip.beginner { background: #fff3e0; } mat-chip.intermediate { background: #e3f2fd; } mat-chip.advanced { background: #e8f5e9; }
  `],
})
export class StudentDetailComponent implements OnInit {
  student: Student | null = null;
  plan: LearningPlan | null = null;
  insights: Insights | null = null;
  instructors: Instructor[] = [];
  generatingPlan = false;

  get probColor(): string {
    const p = this.insights?.passProbability ?? 0;
    return p >= 70 ? '#43a047' : p >= 40 ? '#fb8c00' : '#e53935';
  }

  constructor(
    private route: ActivatedRoute,
    private studentSvc: StudentService,
    private instructorSvc: InstructorService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.studentSvc.getById(id).subscribe(({ student }) => this.student = student);
    this.studentSvc.getPlan(id).subscribe(({ plan }) => this.plan = plan);
    this.instructorSvc.getAll().subscribe(({ instructors }) => this.instructors = instructors);
  }

  saveProfile(): void {
    if (!this.student) return;
    this.studentSvc.update(this.student.id, this.student).subscribe({
      next: () => this.snack.open('Profile saved!', 'OK', { duration: 2000 }),
      error: () => this.snack.open('Save failed', 'OK', { duration: 2000 }),
    });
  }

  generatePlan(): void {
    if (!this.student) return;
    this.generatingPlan = true;
    this.studentSvc.generatePlan(this.student.id).subscribe({
      next: ({ plan }) => { this.plan = plan; this.generatingPlan = false;
        this.snack.open('AI learning plan generated!', 'OK', { duration: 3000 }); },
      error: () => { this.generatingPlan = false;
        this.snack.open('Plan generation failed', 'OK', { duration: 3000 }); },
    });
  }

  loadInsights(): void {
    if (!this.student) return;
    this.studentSvc.getInsights(this.student.id).subscribe({
      next: ({ insights }) => this.insights = insights,
      error: () => this.snack.open('Could not load insights', 'OK', { duration: 2000 }),
    });
  }
}
