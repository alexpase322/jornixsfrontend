import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};

export const roleGuard = (allowedRole: string): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    const userRole = authService.userRole();
    if (userRole !== allowedRole) {
      // Redirigir al dashboard correcto segun el rol
      if (userRole === 'ROLE_ADMINISTRADOR') {
        router.navigate(['/admin/dashboard']);
      } else if (userRole === 'ROLE_TRABAJADOR') {
        router.navigate(['/worker/dashboard']);
      } else {
        router.navigate(['/login']);
      }
      return false;
    }

    return true;
  };
};
