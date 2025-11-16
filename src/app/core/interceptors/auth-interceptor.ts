import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inyectamos el AuthService para acceder al token.
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Verificamos si la petición va a nuestra API.
  // Esto evita enviar el token a APIs externas si las hubiera.
  const isApiUrl = req.url.startsWith(environment.apiUrl);

  // Si tenemos un token y la petición es para nuestra API, añadimos la cabecera.
  if (token && isApiUrl) {
    // Clonamos la petición original para no modificarla directamente.
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    // Pasamos la petición clonada al siguiente manejador.
    return next(clonedRequest);
  }

  // Si no hay token o no es una petición a nuestra API, la dejamos pasar sin cambios.
  return next(req);
};
