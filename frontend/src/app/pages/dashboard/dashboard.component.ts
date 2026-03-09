import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { forkJoin } from 'rxjs';
import { BarChartComponent } from '../../components/bar-chart/bar-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BarChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);

  summary = signal<any>(null);
  value = signal<any>(null);
  topArtists = signal<any[]>([]);
  topGenres = signal<any[]>([]);
  topStyles = signal<any[]>([]);
  formats = signal<any[]>([]);
  decades = signal<any[]>([]);
  countries = signal<any[]>([]);
  valuableReleases = signal<any[]>([]);
  insights = signal<string[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    forkJoin({
      summary: this.api.getDashboardSummary(),
      value: this.api.getDashboardValue(),
      topArtists: this.api.getTopArtists(),
      topGenres: this.api.getTopGenres(),
      topStyles: this.api.getTopStyles(),
      formats: this.api.getFormats(),
      decades: this.api.getDecades(),
      countries: this.api.getCountries(),
      valuableReleases: this.api.getValuableReleases(),
      insights: this.api.getInsights(),
    }).subscribe({
      next: (data) => {
        this.summary.set(data.summary);
        this.value.set(data.value);
        this.topArtists.set(data.topArtists);
        this.topGenres.set(data.topGenres);
        this.topStyles.set(data.topStyles);
        this.formats.set(data.formats);
        this.decades.set(data.decades);
        this.countries.set(data.countries);
        this.valuableReleases.set(data.valuableReleases);
        this.insights.set(data.insights);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load dashboard data.');
        this.loading.set(false);
      },
    });
  }
}
