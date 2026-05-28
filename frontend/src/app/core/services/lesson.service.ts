import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Lesson, LessonFeedback } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LessonService {
  private base = `${environment.apiUrl}/lessons`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ lessons: Lesson[] }> {
    return this.http.get<{ lessons: Lesson[] }>(this.base);
  }

  create(payload: Partial<Lesson>): Observable<{ lesson: Lesson }> {
    return this.http.post<{ lesson: Lesson }>(this.base, payload);
  }

  update(id: number, payload: Partial<Lesson>): Observable<{ lesson: Lesson }> {
    return this.http.put<{ lesson: Lesson }>(`${this.base}/${id}`, payload);
  }

  addFeedback(lessonId: number, feedback: Partial<LessonFeedback>): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/${lessonId}/feedback`, feedback);
  }

  suggestSchedule(studentId: number, instructorId: number): Observable<{ suggestions: any[] }> {
    const params = new HttpParams()
      .set('student_id', studentId)
      .set('instructor_id', instructorId);
    return this.http.get<{ suggestions: any[] }>(`${environment.apiUrl}/schedule/suggest`, { params });
  }
}
