import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Route } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RouteService {
  private base = `${environment.apiUrl}/routes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ routes: Route[] }> {
    return this.http.get<{ routes: Route[] }>(this.base);
  }

  getById(id: number): Observable<{ route: Route }> {
    return this.http.get<{ route: Route }>(`${this.base}/${id}`);
  }

  create(payload: Partial<Route>): Observable<{ route: Route }> {
    return this.http.post<{ route: Route }>(this.base, payload);
  }

  suggestRoute(topic: string, city: string): Observable<{ suggestion: any }> {
    return this.http.post<{ suggestion: any }>(`${this.base}/suggest`, { topic, city });
  }

  geocode(address: string): Observable<{ lat: number; lon: number }> {
    return this.http.post<{ lat: number; lon: number }>(`${environment.apiUrl}/geocode`, { address });
  }
}
