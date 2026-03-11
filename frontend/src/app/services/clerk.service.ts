import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

interface ClerkUser {
  id: string;
}

interface ClerkInstance {
  user: ClerkUser | null | undefined;
  session: { getToken(): Promise<string | null> } | null | undefined;
  load(options?: Record<string, unknown>): Promise<void>;
  addListener(callback: (resources: { user: ClerkUser | null | undefined }) => void): () => void;
  redirectToSignIn(options?: { redirectUrl?: string }): void;
  openSignIn(): void;
  openSignUp(): void;
  signOut(): Promise<void>;
  mountSignIn(element: HTMLElement): void;
  mountSignUp(element: HTMLElement): void;
  unmountSignIn(element: HTMLElement): void;
  unmountSignUp(element: HTMLElement): void;
}

@Injectable({ providedIn: 'root' })
export class ClerkService {
  private clerk: ClerkInstance | null = null;

  readonly isLoaded = signal(false);
  readonly isSignedIn = signal(false);
  readonly userId = signal<string | null>(null);

  async init(): Promise<void> {
    try {
      const module = await import('@clerk/clerk-js');
      type ClerkModule = { default?: new (key: string) => ClerkInstance; Clerk?: new (key: string) => ClerkInstance };
      const ClerkClass = ((module as unknown as ClerkModule).default ?? (module as unknown as ClerkModule).Clerk) as new (key: string) => ClerkInstance;
      this.clerk = new ClerkClass(environment.clerkPublishableKey);
      await this.clerk.load({
        sdkMetadata: {
          name: '@clerk/clerk-js',
          version: '6.0.0',
          uiComponents: true,
        },
      });

      this.isSignedIn.set(!!this.clerk.user);
      this.userId.set(this.clerk.user?.id ?? null);

      this.clerk.addListener(({ user }) => {
        this.isSignedIn.set(!!user);
        this.userId.set(user?.id ?? null);
      });
    } catch (_err) {
      console.error('[Clerk] Failed to initialize:', _err);
    } finally {
      this.isLoaded.set(true);
    }
  }

  async getToken(): Promise<string | null> {
    return this.clerk?.session?.getToken() ?? null;
  }

  redirectToSignIn(): void {
    this.clerk?.redirectToSignIn({ redirectUrl: window.location.origin + '/dashboard' });
  }

  openSignIn(): void {
    this.clerk?.openSignIn();
  }

  openSignUp(): void {
    this.clerk?.openSignUp();
  }

  async signOut(): Promise<void> {
    await this.clerk?.signOut();
  }

  mountSignIn(element: HTMLElement): void {
    this.clerk?.mountSignIn(element);
  }

  mountSignUp(element: HTMLElement): void {
    this.clerk?.mountSignUp(element);
  }

  unmountSignIn(element: HTMLElement): void {
    this.clerk?.unmountSignIn(element);
  }

  unmountSignUp(element: HTMLElement): void {
    this.clerk?.unmountSignUp(element);
  }

  get user(): ClerkUser | null | undefined {
    return this.clerk?.user ?? null;
  }
}
