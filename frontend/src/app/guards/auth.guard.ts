import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { ClerkService } from '../services/clerk.service';

export const authGuard: CanActivateFn = () => {
  const clerk = inject(ClerkService);

  if (!clerk.isSignedIn()) {
    clerk.redirectToSignIn();
    return false;
  }
  return true;
};
