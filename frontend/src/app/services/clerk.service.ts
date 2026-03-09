import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClerkService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private clerk: any;

  readonly isLoaded = signal(false);
  readonly isSignedIn = signal(false);
  readonly userId = signal<string | null>(null);

  async init(): Promise<void> {
    try {
      const module = await import('@clerk/clerk-js');
      // clerk-js default export is the Clerk constructor
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ClerkClass = (module as any).default ?? (module as any).Clerk ?? module;
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.clerk.addListener(({ user }: { user: any }) => {
        this.isSignedIn.set(!!user);
        this.userId.set(user?.id ?? null);
      });
    } catch (err) {
      console.error('[Clerk] Failed to initialize:', err);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get user(): any {
    return this.clerk?.user ?? null;
  }
}
