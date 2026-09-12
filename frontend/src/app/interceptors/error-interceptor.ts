import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

// Runs after every response comes back. When the request failed, it turns the
// HttpErrorResponse into one readable message, so the pages only have to show
// error.message instead of digging into the response each time.
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      let message: string;

      if (error.error instanceof ErrorEvent) {
        // client side: the request never reached the server
        message = `Error: ${error.error.message}`;
      } else if (error.status === 0) {
        // the backend is not running, or the network is down
        message = 'Could not reach the server';
      } else {
        // server side: the backend always answers with { status, message }
        message =
          error.error?.message ??
          `Error Code: ${error.status} Message: ${error.message}`;
      }

      // A 401 on a request that carried a token means the token is no longer
      // accepted (expired, or the account was deleted), so the session ends.
      // A wrong password on the login page is also a 401, but that request
      // has no token, so it is left alone.
      // A page often sends several requests at once and they all fail the
      // same way; getToken() is only still set for the first of them, so the
      // user is sent to the login page once.
      if (
        error.status === 401 &&
        request.headers.has('Authorization') &&
        authService.getToken()
      ) {
        authService.logout();
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url },
        });
      }

      // throwError hands the new error on to whoever subscribed
      return throwError(() => new Error(message));
    }),
  );
};
