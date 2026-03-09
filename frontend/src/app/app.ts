import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClerkService } from './services/clerk.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    @if (clerk.isLoaded()) {
      @if (clerk.isSignedIn()) {
        <nav class="nav">
          <span class="brand">Vinyl Intelligence</span>
          <div class="nav-links">
            <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
            <a routerLink="/collection" routerLinkActive="active">Collection</a>
            <a routerLink="/settings" routerLinkActive="active">Settings</a>
          </div>
        </nav>
        <main>
          <router-outlet />
        </main>
      } @else {
        <router-outlet />
      }
    } @else {
      <div class="splash">Loading…</div>
    }
  `,
  styles: [`
    .nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      height: 56px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .brand {
      font-weight: 700;
      font-size: 1rem;
      color: var(--text);
      letter-spacing: -0.02em;
    }

    .nav-links {
      display: flex;
      gap: 1.5rem;

      a {
        color: var(--text-muted);
        text-decoration: none;
        font-size: 0.875rem;
        transition: color 0.15s;

        &:hover, &.active { color: var(--text); }
      }
    }

    main { min-height: calc(100vh - 56px); }

    .splash {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: var(--text-muted);
    }
  `],
})
export class App {
  protected clerk = inject(ClerkService);
}
