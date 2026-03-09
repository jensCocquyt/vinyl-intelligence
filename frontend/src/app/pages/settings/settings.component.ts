import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ClerkService } from '../../services/clerk.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private api = inject(ApiService);
  private clerk = inject(ClerkService);
  private route = inject(ActivatedRoute);

  connection = signal<any>(null);
  syncStatus = signal<any>(null);
  syncHistory = signal<any[]>([]);
  syncing = signal(false);
  message = signal<string | null>(null);

  ngOnInit(): void {
    this.load();

    this.route.queryParams.subscribe((params) => {
      if (params['connected'] === 'true') {
        this.message.set('Discogs account connected successfully.');
        this.load();
      } else if (params['error']) {
        this.message.set('Failed to connect Discogs account. Please try again.');
      }
    });
  }

  load(): void {
    this.api.getConnection().subscribe({
      next: (res) => this.connection.set(res.connection),
      error: () => this.connection.set(null),
    });
    this.api.getSyncStatus().subscribe({
      next: (res) => this.syncStatus.set(res),
    });
    this.api.getSyncHistory().subscribe({
      next: (res) => this.syncHistory.set(res.jobs),
    });
  }

  connectDiscogs(): void {
    this.api.startDiscogsConnect().subscribe({
      next: (res) => {
        window.location.href = res.authorizeUrl;
      },
      error: () => this.message.set('Failed to start connection. Please try again.'),
    });
  }

  disconnectDiscogs(): void {
    if (!confirm('Disconnect your Discogs account? Your imported data will remain.')) return;
    this.api.disconnectDiscogs().subscribe({
      next: () => {
        this.connection.set(null);
        this.message.set('Discogs account disconnected.');
      },
    });
  }

  startSync(): void {
    this.syncing.set(true);
    this.message.set(null);
    this.api.startSync().subscribe({
      next: () => {
        this.message.set('Sync started. This may take a few minutes for large collections.');
        this.syncing.set(false);
        setTimeout(() => this.load(), 3000);
      },
      error: (err) => {
        this.message.set(err.error?.error ?? 'Sync failed.');
        this.syncing.set(false);
      },
    });
  }

  signOut(): void {
    this.clerk.signOut();
  }
}
