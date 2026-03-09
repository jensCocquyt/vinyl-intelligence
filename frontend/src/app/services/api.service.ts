import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { from, switchMap, Observable } from 'rxjs';
import { ClerkService } from './clerk.service';
import { environment } from '../../environments/environment';
import type {
  CollectionItem,
  DashboardSummary,
  DashboardValue,
  DiscogsConnection,
  SyncJob,
  ValuableRelease,
  ChartPoint,
} from '../types/models';

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
  getConnection(): Observable<{ connection: DiscogsConnection | null }> {
    return this.get<{ connection: DiscogsConnection | null }>('/discogs/connection');
  }

  startDiscogsConnect(): Observable<{ authorizeUrl: string }> {
    return this.post<{ authorizeUrl: string }>('/discogs/connect/start');
  }

  disconnectDiscogs(): Observable<{ ok: boolean }> {
    return this.delete<{ ok: boolean }>('/discogs/connection');
  }

  // Sync
  startSync(): Observable<{ jobId: string; status: string }> {
    return this.post<{ jobId: string; status: string }>('/collection/sync');
  }

  getSyncStatus(): Observable<{ connection: DiscogsConnection | null; latestJob: SyncJob | null }> {
    return this.get<{ connection: DiscogsConnection | null; latestJob: SyncJob | null }>(
      '/collection/sync-status'
    );
  }

  getSyncHistory(): Observable<{ jobs: SyncJob[] }> {
    return this.get<{ jobs: SyncJob[] }>('/collection/sync-history');
  }

  // Dashboard
  getDashboardSummary(): Observable<DashboardSummary> {
    return this.get<DashboardSummary>('/dashboard/summary');
  }

  getDashboardValue(): Observable<DashboardValue> {
    return this.get<DashboardValue>('/dashboard/value');
  }

  getTopArtists(): Observable<ChartPoint[]> {
    return this.get<ChartPoint[]>('/dashboard/top-artists');
  }

  getTopGenres(): Observable<ChartPoint[]> {
    return this.get<ChartPoint[]>('/dashboard/top-genres');
  }

  getTopStyles(): Observable<ChartPoint[]> {
    return this.get<ChartPoint[]>('/dashboard/top-styles');
  }

  getFormats(): Observable<ChartPoint[]> {
    return this.get<ChartPoint[]>('/dashboard/formats');
  }

  getDecades(): Observable<ChartPoint[]> {
    return this.get<ChartPoint[]>('/dashboard/decades');
  }

  getCountries(): Observable<ChartPoint[]> {
    return this.get<ChartPoint[]>('/dashboard/countries');
  }

  getValuableReleases(): Observable<ValuableRelease[]> {
    return this.get<ValuableRelease[]>('/dashboard/valuable-releases');
  }

  getInsights(): Observable<string[]> {
    return this.get<string[]>('/dashboard/insights');
  }

  // Collection
  getCollection(
    params?: Record<string, string>
  ): Observable<{ items: CollectionItem[]; total: number; page: number; pageSize: number }> {
    return this.get<{ items: CollectionItem[]; total: number; page: number; pageSize: number }>(
      '/collection',
      params
    );
  }

  getCollectionItem(id: string): Observable<{ item: CollectionItem }> {
    return this.get<{ item: CollectionItem }>(`/collection/${id}`);
  }
}
