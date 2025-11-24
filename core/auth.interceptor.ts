import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor de autenticación HTTP
 *
 * Intercepta todas las peticiones HTTP salientes y añade automáticamente
 * el token JWT en el header Authorization si está disponible en localStorage.
 *
 * Esto permite que los endpoints protegidos del backend reciban el token
 * sin tener que añadirlo manualmente en cada servicio.
 *
 * @param req - Petición HTTP original
 * @param next - Siguiente manejador en la cadena de interceptores
 * @returns Observable de la respuesta HTTP
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Obtener el token JWT del localStorage
  const tok = localStorage.getItem('jwt_token');

  // Si hay token, clonar la petición y añadir el header Authorization
  // Si no hay token, dejar pasar la petición sin modificar
  return next(tok ? req.clone({ setHeaders: { Authorization: `Bearer ${tok}` } }) : req);
};
