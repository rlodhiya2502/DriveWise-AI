import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LessonService } from '../../core/services/lesson.service';
import { InstructorService } from '../../core/services/instructor.service';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { Lesson, Instructor, Student } from '../../core/models/models';
import { DayNamePipe } from '../../shared/pipes/day-name.pipe';

@Component({
  selector: 'app-scheduling',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatChipsModule,
    MatDialogModule, MatSnackBarModule, DayNamePipe],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2><mat-icon>event</mat-icon> Lesson Scheduling</h2>
        <button mat-raised-button color="primary" (click)="showBookingForm = !showBookingForm">
          <mat-icon>add</mat-icon> Book Lesson
        </button>
      </div>

      <!-- Booking form -->
      <mat-card *ngIf="showBookingForm" class="booking-form">
        <mat-card-header><mat-card-title>Book New Lesson</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-grid">
            <mat-form-field *ngIf="!isStudent">
              <mat-label>Student</mat-label>
              <mat-select [(ngModel)]="booking.student_id">
                <mat-option *ngFor="let s of students" [value]="s.id">{{ s.name }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Instructor</mat-label>
              <mat-select [(ngModel)]="booking.instructor_id">
                <mat-option *ngFor="let i of instructors" [value]="i.id">{{ i.name }} ⭐ {{ i.rating }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Topic</mat-label>
              <mat-select [(ngModel)]="booking.topic">
                <mat-option *ngFor="let t of topics" [value]="t">{{ t }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Date & Time</mat-label>
              <input matInput type="datetime-local" [(ngModel)]="booking.scheduled_at">
            </mat-form-field>
            <mat-form-field>
              <mat-label>Duration (mins)</mat-label>
              <mat-select [(ngModel)]="booking.duration_mins">
                <mat-option [value]="60">60 min</mat-option>
                <mat-option [value]="90">90 min</mat-option>
                <mat-option [value]="120">120 min</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field class="full-width">
              <mat-label>Notes</mat-label>
              <textarea matInput [(ngModel)]="booking.notes" rows="2"></textarea>
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-raised-button color="primary" (click)="bookLesson()">Book Lesson</button>
            <button mat-button (click)="showBookingForm = false">Cancel</button>
            <button mat-stroked-button color="accent" (click)="getSuggestions()" *ngIf="booking.student_id && booking.instructor_id">
              <mat-icon>auto_awesome</mat-icon> AI Suggest Times
            </button>
          </div>
          <div *ngIf="suggestions.length" class="suggestions">
            <h4>AI Suggested Times:</h4>
            <div *ngFor="let s of suggestions" class="suggestion-chip" (click)="applySuggestion(s)">
              <mat-icon>schedule</mat-icon> {{ s.day_of_week | dayName }} {{ s.start_time }} — {{ s.reason }}
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Lessons list -->
      <mat-card>
        <mat-card-header><mat-card-title>All Lessons</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="filters">
            <mat-chip-listbox [(ngModel)]="filterStatus" aria-label="Status filter">
              <mat-chip-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-chip-option>
            </mat-chip-listbox>
          </div>
          <div class="lessons-table">
            <div class="lesson-header">
              <span>Date & Time</span><span>Topic</span><span>Instructor</span><span>Status</span><span>Actions</span>
            </div>
            <div *ngFor="let lesson of filteredLessons" class="lesson-row">
              <span>{{ lesson.scheduled_at | date:'d MMM yyyy, HH:mm' }}</span>
              <span>{{ lesson.topic }}</span>
              <span>{{ lesson.instructor_name || '—' }}</span>
              <mat-chip [class]="lesson.status">{{ lesson.status }}</mat-chip>
              <div class="actions">
                <button mat-icon-button color="warn" (click)="cancelLesson(lesson)"
                  *ngIf="lesson.status === 'scheduled'" title="Cancel">
                  <mat-icon>cancel</mat-icon>
                </button>
              </div>
            </div>
            <div *ngIf="filteredLessons.length === 0" class="empty">No lessons found.</div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1100px; margin: 0 auto; padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .booking-form { margin-bottom: 24px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    .form-actions { display: flex; gap: 12px; margin-top: 8px; }
    .suggestions { margin-top: 16px; }
    .suggestion-chip { display: flex; align-items: center; gap: 8px; padding: 8px 12px;
      border: 1px solid #1976d2; border-radius: 8px; cursor: pointer; margin: 6px 0; font-size: 13px; }
    .suggestion-chip:hover { background: #e3f2fd; }
    .filters { margin-bottom: 16px; }
    .lessons-table { font-size: 14px; }
    .lesson-header { display: grid; grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr;
      padding: 8px; background: #f5f5f5; border-radius: 6px; font-weight: 600; }
    .lesson-row { display: grid; grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr;
      padding: 10px 8px; border-bottom: 1px solid #eee; align-items: center; }
    .actions { display: flex; }
    .empty { text-align: center; color: #999; padding: 24px; }
    mat-chip.scheduled { background: #e3f2fd; }
    mat-chip.completed { background: #e8f5e9; }
    mat-chip.cancelled { background: #fce4ec; }
  `],
})
export class SchedulingComponent implements OnInit {
  lessons: Lesson[] = [];
  instructors: Instructor[] = [];
  students: Student[] = [];
  suggestions: any[] = [];
  showBookingForm = false;
  filterStatus = 'all';
  statuses = ['all', 'scheduled', 'completed', 'cancelled'];
  topics = ['Town Driving', 'Roundabouts', 'Motorway', 'Parallel Parking', 'Bay Parking',
    'Emergency Stop', 'Manoeuvres', 'Test Preparation', 'Night Driving'];

  booking: any = { duration_mins: 60, topic: '' };

  get isStudent(): boolean { return this.auth.isStudent; }
  get filteredLessons(): Lesson[] {
    return this.filterStatus === 'all' ? this.lessons : this.lessons.filter(l => l.status === this.filterStatus);
  }

  constructor(
    private lessonSvc: LessonService,
    private instructorSvc: InstructorService,
    private studentSvc: StudentService,
    private auth: AuthService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.lessonSvc.getAll().subscribe(({ lessons }) => this.lessons = lessons);
    this.instructorSvc.getAll().subscribe(({ instructors }) => this.instructors = instructors);
    if (!this.isStudent) {
      this.studentSvc.getAll().subscribe(({ students }) => this.students = students);
    }
  }

  bookLesson(): void {
    this.lessonSvc.create(this.booking).subscribe({
      next: ({ lesson }) => {
        this.lessons.unshift(lesson);
        this.showBookingForm = false;
        this.booking = { duration_mins: 60, topic: '' };
        this.snack.open('Lesson booked! WhatsApp confirmation sent.', 'OK', { duration: 3000 });
      },
      error: (e) => this.snack.open(e.error?.error ?? 'Booking failed', 'OK', { duration: 4000 }),
    });
  }

  cancelLesson(lesson: Lesson): void {
    this.lessonSvc.update(lesson.id, { status: 'cancelled' }).subscribe({
      next: ({ lesson: updated }) => {
        const idx = this.lessons.findIndex(l => l.id === lesson.id);
        if (idx !== -1) this.lessons[idx] = updated;
        this.snack.open('Lesson cancelled.', 'OK', { duration: 2000 });
      },
    });
  }

  getSuggestions(): void {
    this.lessonSvc.suggestSchedule(this.booking.student_id, this.booking.instructor_id).subscribe({
      next: ({ suggestions }) => this.suggestions = suggestions,
      error: () => this.snack.open('Could not get AI suggestions', 'OK', { duration: 2000 }),
    });
  }

  applySuggestion(s: any): void {
    // Map suggestion to datetime-local format
    this.snack.open('Suggestion applied — set date manually based on slot', 'OK', { duration: 2000 });
  }
}
