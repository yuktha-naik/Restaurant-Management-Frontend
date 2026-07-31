import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { mockApiInterceptor } from './mock/mock-api.interceptor';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK MODE — comment out `withInterceptors(...)` once the Spring Boot
// backend is running on http://localhost:8080 and you no longer need stubs.
// ─────────────────────────────────────────────────────────────────────────────
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
  ],
};


