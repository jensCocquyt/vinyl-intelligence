import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ClerkService } from '../services/clerk.service';

export const authGuard: CanActivateFn = () => {
  const clerk = inject(ClerkService);
  const router = inject(Router);

  if (!clerk.isSignedIn()) {
    clerk.redirectToSignIn();
    return false;
  }
  return true;
};
