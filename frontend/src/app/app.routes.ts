import { Routes } from '@angular/router';
import { authGuard, adminGuard, instructorGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'students',
    canActivate: [authGuard, instructorGuard],
    loadComponent: () => import('./features/students/students.component').then(m => m.StudentsComponent),
  },
  {
    path: 'students/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/students/student-detail.component').then(m => m.StudentDetailComponent),
  },
  {
    path: 'instructors',
    canActivate: [authGuard],
    loadComponent: () => import('./features/instructors/instructors.component').then(m => m.InstructorsComponent),
  },
  {
    path: 'scheduling',
    canActivate: [authGuard],
    loadComponent: () => import('./features/scheduling/scheduling.component').then(m => m.SchedulingComponent),
  },
  {
    path: 'routes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/routes/routes.component').then(m => m.RoutesComponent),
  },
  {
    path: 'insights',
    canActivate: [authGuard],
    loadComponent: () => import('./features/insights/insights.component').then(m => m.InsightsComponent),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
  },
  { path: '**', redirectTo: '/dashboard' },
];
