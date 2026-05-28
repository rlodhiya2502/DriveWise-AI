import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { AdminService } from '../../core/services/admin.service';
import { User } from '../../core/models/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatTableModule,
    MatChipsModule, MatSnackBarModule, MatTabsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2><mat-icon>admin_panel_settings</mat-icon> Admin Portal</h2>
      </div>

      <mat-tab-group>
        <!-- Reports tab -->
        <mat-tab label="Reports">
          <mat-card class="tab-card" *ngIf="reports">
            <mat-card-header><mat-card-title>System Reports</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-num">{{ reports.total_students }}</div>
                  <div class="stat-lbl">Total Students</div>
                </div>
                <div class="stat-box">
                  <div class="stat-num">{{ reports.total_instructors }}</div>
                  <div class="stat-lbl">Instructors</div>
                </div>
                <div class="stat-box">
                  <div class="stat-num">{{ reports.total_lessons }}</div>
                  <div class="stat-lbl">Total Lessons</div>
                </div>
                <div class="stat-box">
                  <div class="stat-num">{{ reports.lessons_this_week }}</div>
                  <div class="stat-lbl">This Week</div>
                </div>
                <div class="stat-box highlight">
                  <div class="stat-num">{{ reports.pass_rate }}%</div>
                  <div class="stat-lbl">Pass Rate</div>
                </div>
              </div>

              <h4>Lessons by Status</h4>
              <div class="status-bars">
                <div *ngFor="let s of reports.lessons_by_status" class="status-row">
                  <mat-chip [class]="s.status">{{ s.status }}</mat-chip>
                  <div class="bar-wrap">
                    <div class="bar" [style.width.%]="barWidth(s.count, reports.total_lessons)"></div>
                  </div>
                  <span>{{ s.count }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <!-- Users tab -->
        <mat-tab label="User Management">
          <mat-card class="tab-card">
            <mat-card-header><mat-card-title>All Users</mat-card-title></mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="users" class="users-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let u">
                    <div class="user-cell">
                      <img [src]="u.avatar || 'assets/default-avatar.png'" class="mini-avatar" alt="">
                      {{ u.name }}
                    </div>
                  </td>
                </ng-container>
                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef>Email</th>
                  <td mat-cell *matCellDef="let u">{{ u.email }}</td>
                </ng-container>
                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef>Role</th>
                  <td mat-cell *matCellDef="let u">
                    <mat-select [(ngModel)]="u.role" (ngModelChange)="updateRole(u)">
                      <mat-option value="student">Student</mat-option>
                      <mat-option value="instructor">Instructor</mat-option>
                      <mat-option value="admin">Admin</mat-option>
                    </mat-select>
                  </td>
                </ng-container>
                <ng-container matColumnDef="created">
                  <th mat-header-cell *matHeaderCellDef>Joined</th>
                  <td mat-cell *matCellDef="let u">{{ u.created_at | date:'d MMM yyyy' }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1100px; margin: 0 auto; padding: 24px; }
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .tab-card { margin-top: 16px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-box { text-align: center; padding: 20px; background: #f5f5f5; border-radius: 10px; }
    .stat-box.highlight { background: #e3f2fd; }
    .stat-num { font-size: 36px; font-weight: 700; color: #1976d2; }
    .stat-lbl { font-size: 12px; color: #666; margin-top: 4px; }
    .status-bars { margin-top: 8px; }
    .status-row { display: flex; align-items: center; gap: 12px; margin: 8px 0; }
    .bar-wrap { flex: 1; height: 12px; background: #eee; border-radius: 6px; overflow: hidden; }
    .bar { height: 100%; background: #1976d2; border-radius: 6px; transition: width 0.3s; }
    .users-table { width: 100%; }
    .user-cell { display: flex; align-items: center; gap: 8px; }
    .mini-avatar { width: 28px; height: 28px; border-radius: 50%; }
    mat-chip.scheduled { background: #e3f2fd; } mat-chip.completed { background: #e8f5e9; }
    mat-chip.cancelled { background: #fce4ec; } mat-chip.no_show { background: #fff3e0; }
  `],
})
export class AdminComponent implements OnInit {
  users: User[] = [];
  reports: any = null;
  displayedColumns = ['name', 'email', 'role', 'created'];

  constructor(private adminSvc: AdminService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.adminSvc.getUsers().subscribe(({ users }) => this.users = users);
    this.adminSvc.getReports().subscribe(({ reports }) => this.reports = reports);
  }

  updateRole(user: User): void {
    this.adminSvc.updateRole(user.id, user.role).subscribe({
      next: () => this.snack.open(`${user.name} is now ${user.role}`, 'OK', { duration: 2000 }),
      error: () => this.snack.open('Role update failed', 'OK', { duration: 2000 }),
    });
  }

  barWidth(count: number, total: number): number {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }
}
