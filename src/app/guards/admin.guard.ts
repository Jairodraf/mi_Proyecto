import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  let isAdmin = false;
  auth.isAdmin$.subscribe(v => isAdmin = v).unsubscribe();
  if (isAdmin) return true;
  router.navigateByUrl('/', { replaceUrl: true });
  return false;
};
