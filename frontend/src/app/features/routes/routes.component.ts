import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { RouteService } from '../../core/services/route.service';
import { AuthService } from '../../core/services/auth.service';
import { Route } from '../../core/models/models';

declare const L: any;

@Component({
  selector: 'app-routes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule, MatChipsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2><mat-icon>map</mat-icon> Route Management</h2>
        <button mat-raised-button color="primary" (click)="showForm = !showForm"
          *ngIf="!isStudent">
          <mat-icon>add</mat-icon> New Route
        </button>
      </div>

      <!-- AI Suggest panel -->
      <mat-card class="suggest-card">
        <mat-card-header>
          <mat-card-title><mat-icon>auto_awesome</mat-icon> AI Route Suggestion</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="suggest-row">
            <mat-form-field>
              <mat-label>Topic</mat-label>
              <mat-select [(ngModel)]="suggestTopic">
                <mat-option *ngFor="let t of topics" [value]="t">{{ t }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>City</mat-label>
              <input matInput [(ngModel)]="suggestCity" placeholder="e.g. London">
            </mat-form-field>
            <button mat-raised-button color="accent" (click)="getSuggestion()" [disabled]="loadingSuggestion">
              <mat-icon>search</mat-icon> {{ loadingSuggestion ? 'Generating…' : 'Suggest Route' }}
            </button>
          </div>
          <div *ngIf="suggestion" class="suggestion-result">
            <p><strong>AI Route:</strong> {{ suggestion.description }}</p>
            <div class="tip-list">
              <span *ngFor="let tip of suggestion.tips" class="tip">💡 {{ tip }}</span>
            </div>
            <button mat-stroked-button color="primary" (click)="useSuggestion()" *ngIf="!isStudent">
              Use This Route
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Create form -->
      <mat-card *ngIf="showForm" class="form-card">
        <mat-card-header><mat-card-title>Create New Route</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="form-grid">
            <mat-form-field>
              <mat-label>Route Name</mat-label>
              <input matInput [(ngModel)]="newRoute.name">
            </mat-form-field>
            <mat-form-field>
              <mat-label>Topic</mat-label>
              <mat-select [(ngModel)]="newRoute.topic">
                <mat-option *ngFor="let t of topics" [value]="t">{{ t }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <p class="hint">Click on the map to add waypoints, or enter coordinates below.</p>
          <div id="create-map" class="map-container"></div>
          <div class="waypoints-list">
            <div *ngFor="let wp of newRoute.waypoints; let i = index" class="waypoint-row">
              <mat-icon>place</mat-icon>
              <span>{{ wp.label || 'Waypoint ' + (i+1) }}</span>
              <span class="coords">({{ wp.lat | number:'1.4-4' }}, {{ wp.lon | number:'1.4-4' }})</span>
              <button mat-icon-button (click)="removeWaypoint(i)"><mat-icon>delete</mat-icon></button>
            </div>
          </div>
          <div class="form-actions">
            <button mat-raised-button color="primary" (click)="createRoute()">Save Route</button>
            <button mat-button (click)="showForm = false">Cancel</button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Map display -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>Routes</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div id="routes-map" class="map-container-lg"></div>
          <div class="routes-grid">
            <mat-card *ngFor="let route of routes" class="route-card" (click)="showRoute(route)">
              <mat-card-header>
                <mat-card-title>{{ route.name }}</mat-card-title>
                <mat-card-subtitle>{{ route.topic }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div *ngIf="route.distance_km">
                  <mat-icon>straighten</mat-icon> {{ route.distance_km }} km
                </div>
                <div>{{ route.waypoints?.length || 0 }} waypoints</div>
                <div class="created-by" *ngIf="route.created_by_name">
                  By {{ route.created_by_name }}
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1100px; margin: 0 auto; padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .suggest-card, .form-card { margin-bottom: 24px; }
    .suggest-row { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
    .suggest-row mat-form-field { flex: 1; min-width: 160px; }
    .suggestion-result { margin-top: 16px; padding: 16px; background: #f3e5f5; border-radius: 8px; }
    .tip-list { display: flex; flex-direction: column; gap: 4px; margin: 8px 0; font-size: 13px; }
    .map-container { height: 300px; border-radius: 8px; margin: 16px 0; }
    .map-container-lg { height: 400px; border-radius: 8px; margin-bottom: 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .hint { color: #666; font-size: 13px; margin: 0 0 8px; }
    .waypoints-list { margin: 8px 0; }
    .waypoint-row { display: flex; align-items: center; gap: 8px; padding: 6px; font-size: 13px; }
    .coords { color: #999; font-size: 11px; }
    .form-actions { display: flex; gap: 12px; margin-top: 16px; }
    .routes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-top: 16px; }
    .route-card { cursor: pointer; } .route-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .created-by { font-size: 12px; color: #999; margin-top: 4px; }
  `],
})
export class RoutesComponent implements OnInit, AfterViewInit {
  routes: Route[] = [];
  showForm = false;
  suggestion: any = null;
  loadingSuggestion = false;
  suggestTopic = '';
  suggestCity = '';
  newRoute: any = { name: '', topic: '', waypoints: [] };
  topics = ['Town Driving', 'Roundabouts', 'Motorway', 'Parallel Parking',
    'Bay Parking', 'Emergency Stop', 'Manoeuvres', 'Test Preparation'];

  private mainMap: any;
  private createMap: any;

  get isStudent(): boolean { return this.auth.isStudent; }

  constructor(
    private routeSvc: RouteService,
    private auth: AuthService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.routeSvc.getAll().subscribe(({ routes }) => this.routes = routes);
    this.loadLeaflet();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMainMap(), 500);
  }

  private loadLeaflet(): void {
    if (typeof L !== 'undefined') return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    document.head.appendChild(script);
  }

  private initMainMap(): void {
    const el = document.getElementById('routes-map');
    if (!el || typeof L === 'undefined') return;
    this.mainMap = L.map('routes-map').setView([51.505, -0.09], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.mainMap);
  }

  showRoute(route: Route): void {
    if (!this.mainMap || !route.waypoints?.length) return;
    const coords = route.waypoints.map((wp: any) => [wp.lat, wp.lon]);
    this.mainMap.setView(coords[0], 14);
    const poly = L.polyline(coords, { color: '#1976d2', weight: 4 }).addTo(this.mainMap);
    route.waypoints.forEach((wp: any) => {
      L.marker([wp.lat, wp.lon]).addTo(this.mainMap).bindPopup(wp.label || 'Waypoint');
    });
    this.mainMap.fitBounds(poly.getBounds());
  }

  getSuggestion(): void {
    if (!this.suggestTopic || !this.suggestCity) return;
    this.loadingSuggestion = true;
    this.routeSvc.suggestRoute(this.suggestTopic, this.suggestCity).subscribe({
      next: ({ suggestion }) => { this.suggestion = suggestion; this.loadingSuggestion = false; },
      error: () => { this.loadingSuggestion = false;
        this.snack.open('AI suggestion failed', 'OK', { duration: 2000 }); },
    });
  }

  useSuggestion(): void {
    if (!this.suggestion) return;
    this.newRoute.topic = this.suggestTopic;
    this.newRoute.name = `${this.suggestTopic} — ${this.suggestCity}`;
    this.newRoute.waypoints = this.suggestion.waypoints ?? [];
    this.showForm = true;
  }

  removeWaypoint(i: number): void {
    this.newRoute.waypoints.splice(i, 1);
  }

  createRoute(): void {
    this.routeSvc.create(this.newRoute).subscribe({
      next: ({ route }) => {
        this.routes.unshift(route);
        this.showForm = false;
        this.newRoute = { name: '', topic: '', waypoints: [] };
        this.snack.open('Route created!', 'OK', { duration: 2000 });
      },
      error: (e) => this.snack.open(e.error?.error ?? 'Failed to create route', 'OK', { duration: 3000 }),
    });
  }
}
