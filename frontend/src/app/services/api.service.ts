import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { from, switchMap, Observable } from 'rxjs';
import { ClerkService } from './clerk.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private clerk = inject(ClerkService);

  private get<T>(path: string, params?: Record<string, string>): Observable<T> {
    return from(this.clerk.getToken()).pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        const httpParams = params ? new HttpParams({ fromObject: params }) : undefined;
        return this.http.get<T>(`${environment.apiUrl}${path}`, { headers, params: httpParams });
      })
    );
  }

  private post<T>(path: string, body?: unknown): Observable<T> {
    return from(this.clerk.getToken()).pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        return this.http.post<T>(`${environment.apiUrl}${path}`, body, { headers });
      })
    );
  }

  private delete<T>(path: string): Observable<T> {
    return from(this.clerk.getToken()).pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        return this.http.delete<T>(`${environment.apiUrl}${path}`, { headers });
      })
    );
  }

  // Discogs connection
  getConnection() {
    return this.get<{ connection: any }>('/discogs/connection');
  }

  startDiscogsConnect() {
    return this.post<{ authorizeUrl: string }>('/discogs/connect/start');
  }

  disconnectDiscogs() {
    return this.delete<{ ok: boolean }>('/discogs/connection');
  }

  // Sync
  startSync() {
    return this.post<{ jobId: string; status: string }>('/collection/sync');
  }

  getSyncStatus() {
    return this.get<{ connection: any; latestJob: any }>('/collection/sync-status');
  }

  getSyncHistory() {
    return this.get<{ jobs: any[] }>('/collection/sync-history');
  }

  // Dashboard
  getDashboardSummary() {
    return this.get<any>('/dashboard/summary');
  }

  getDashboardValue() {
    return this.get<any>('/dashboard/value');
  }

  getTopArtists() {
    return this.get<{ artist: string; count: number }[]>('/dashboard/top-artists');
  }

  getTopGenres() {
    return this.get<{ genre: string; count: number }[]>('/dashboard/top-genres');
  }

  getTopStyles() {
    return this.get<{ style: string; count: number }[]>('/dashboard/top-styles');
  }

  getFormats() {
    return this.get<{ format: string; count: number }[]>('/dashboard/formats');
  }

  getDecades() {
    return this.get<{ decade: string; count: number }[]>('/dashboard/decades');
  }

  getCountries() {
    return this.get<{ country: string; count: number }[]>('/dashboard/countries');
  }

  getValuableReleases() {
    return this.get<any[]>('/dashboard/valuable-releases');
  }

  getInsights() {
    return this.get<string[]>('/dashboard/insights');
  }

  // Collection
  getCollection(params?: Record<string, string>) {
    return this.get<{ items: any[]; total: number; page: number; pageSize: number }>(
      '/collection',
      params
    );
  }

  getCollectionItem(id: string) {
    return this.get<{ item: any }>(`/collection/${id}`);
  }
}
