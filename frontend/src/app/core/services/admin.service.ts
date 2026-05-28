import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getUsers(): Observable<{ users: User[] }> {
    return this.http.get<{ users: User[] }>(`${environment.apiUrl}/admin/users`);
  }

  updateRole(userId: number, role: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${environment.apiUrl}/admin/users/${userId}/role`, { role });
  }

  getReports(): Observable<{ reports: any }> {
    return this.http.get<{ reports: any }>(`${environment.apiUrl}/admin/reports`);
  }
}
