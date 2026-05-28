import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../core/services/student.service';
import { Student } from '../../core/models/models';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatInputModule, MatFormFieldModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2><mat-icon>people</mat-icon> Students</h2>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search students</mat-label>
          <input matInput [(ngModel)]="search" placeholder="Name or email...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <div class="students-grid">
        <mat-card *ngFor="let student of filteredStudents" class="student-card">
          <mat-card-header>
            <img mat-card-avatar [src]="student.avatar || 'assets/default-avatar.png'" alt="avatar">
            <mat-card-title>{{ student.name }}</mat-card-title>
            <mat-card-subtitle>{{ student.email }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="info-row">
              <mat-icon>school</mat-icon>
              <mat-chip [class]="student.skill_level">{{ student.skill_level | titlecase }}</mat-chip>
            </div>
            <div class="info-row" *ngIf="student.test_date">
              <mat-icon>event</mat-icon>
              <span>Test: {{ student.test_date | date:'d MMM yyyy' }}</span>
            </div>
            <div class="info-row">
              <mat-icon>speed</mat-icon>
              <span>Pace: {{ student.learning_pace | titlecase }}</span>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary" [routerLink]="['/students', student.id]">
              <mat-icon>visibility</mat-icon> View Profile
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
      <div *ngIf="filteredStudents.length === 0" class="empty-state">
        <mat-icon>people_outline</mat-icon>
        <p>No students found.</p>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1100px; margin: 0 auto; padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .search-field { width: 280px; }
    .students-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .student-card { cursor: pointer; transition: box-shadow 0.2s; }
    .student-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
    .info-row { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: 14px; }
    .info-row mat-icon { font-size: 18px; width: 18px; height: 18px; color: #666; }
    mat-chip.beginner { background: #fff3e0; }
    mat-chip.intermediate { background: #e3f2fd; }
    mat-chip.advanced { background: #e8f5e9; }
    .empty-state { text-align: center; color: #999; padding: 48px; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; }
  `],
})
export class StudentsComponent implements OnInit {
  students: Student[] = [];
  search = '';

  get filteredStudents(): Student[] {
    const q = this.search.toLowerCase();
    return q ? this.students.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
             : this.students;
  }

  constructor(private studentSvc: StudentService) {}

  ngOnInit(): void {
    this.studentSvc.getAll().subscribe(({ students }) => this.students = students);
  }
}
