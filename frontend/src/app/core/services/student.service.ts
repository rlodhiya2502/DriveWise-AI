import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Student, LearningPlan, Insights } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private base = `${environment.apiUrl}/students`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ students: Student[] }> {
    return this.http.get<{ students: Student[] }>(this.base);
  }

  getById(id: number): Observable<{ student: Student }> {
    return this.http.get<{ student: Student }>(`${this.base}/${id}`);
  }

  update(id: number, payload: Partial<Student>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/${id}`, payload);
  }

  getPlan(id: number): Observable<{ plan: LearningPlan | null }> {
    return this.http.get<{ plan: LearningPlan | null }>(`${this.base}/${id}/plan`);
  }

  generatePlan(id: number): Observable<{ plan: LearningPlan }> {
    return this.http.post<{ plan: LearningPlan }>(`${this.base}/${id}/plan/generate`, {});
  }

  getInsights(id: number): Observable<{ insights: Insights | null }> {
    return this.http.get<{ insights: Insights | null }>(`${this.base}/${id}/insights`);
  }
}
