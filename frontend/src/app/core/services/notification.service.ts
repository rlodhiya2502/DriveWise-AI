import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notification } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private base = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ notifications: Notification[] }> {
    return this.http.get<{ notifications: Notification[] }>(this.base);
  }

  markRead(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/${id}/read`, {});
  }
}
