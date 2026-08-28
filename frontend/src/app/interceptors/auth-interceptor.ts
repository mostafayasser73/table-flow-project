import { HttpInterceptorFn } from '@angular/common/http';

// Runs before every request leaves the app and adds the token, so no service
// has to remember to do it:
//
//   Authorization: Bearer <token>
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem('tableflow_token');

  if (!token) {
    return next(request);
  }

  // requests are read only, so a copy with the extra header is sent instead
  const withToken = request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(withToken);
};
