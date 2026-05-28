import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Instructor, Availability, InstructorMatch } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InstructorService {
  private base = `${environment.apiUrl}/instructors`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ instructors: Instructor[] }> {
    return this.http.get<{ instructors: Instructor[] }>(this.base);
  }

  getById(id: number): Observable<{ instructor: Instructor }> {
    return this.http.get<{ instructor: Instructor }>(`${this.base}/${id}`);
  }

  update(id: number, payload: Partial<Instructor>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/${id}`, payload);
  }

  getAvailability(id: number): Observable<{ availability: Availability[] }> {
    return this.http.get<{ availability: Availability[] }>(`${this.base}/${id}/availability`);
  }

  setAvailability(id: number, slots: Partial<Availability>[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/${id}/availability`, { slots });
  }

  matchForStudent(studentId: number): Observable<{ instructors: Instructor[]; ai_ranking: InstructorMatch[] }> {
    const params = new HttpParams().set('student_id', studentId);
    return this.http.get<{ instructors: Instructor[]; ai_ranking: InstructorMatch[] }>(
      `${environment.apiUrl}/match/instructor`, { params }
    );
  }
}
