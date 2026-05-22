import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentSessionUser().pipe(
    map((currentUser) => router.createUrlTree([authService.getLandingRoute(currentUser)])),
    catchError(() => of(true))
  );
};
