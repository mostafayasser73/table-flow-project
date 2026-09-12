import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth-interceptor';
import { errorInterceptor } from './interceptors/error-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    // makes HttpClient available. The interceptors run in this order on the
    // way out: the token is added first, then the error one waits for the
    // response and turns a failure into a readable message.
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ],
};
