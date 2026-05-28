import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url.toLowerCase();

  const isPublicAuth = url.includes('/auth/login') || url.includes('/auth/register');
  if (isPublicAuth) return next(req);

  const token = localStorage.getItem('velora_token');
  if (!token) return next(req);

  const cloned = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
  return next(cloned);
};
