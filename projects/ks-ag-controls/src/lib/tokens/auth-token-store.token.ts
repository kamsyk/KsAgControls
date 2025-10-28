import { InjectionToken } from '@angular/core';

export enum AuthTokenStore {
  localStorage = 'local_storage',
  cookie = 'cookie',
  localStorageAndCookie = 'local_storage_and_cookie',
}

export const AUTH_TOKEN_STORE = new InjectionToken<AuthTokenStore>(
  'auth.token.type',
);
