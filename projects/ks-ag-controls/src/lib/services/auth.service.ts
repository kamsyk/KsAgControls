import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, take, tap } from 'rxjs';
import { Router } from '@angular/router';
import { SsrCookieService } from 'ngx-cookie-service-ssr';
import { AUTH_TOKEN_KEY } from '../tokens/auth-token-key.token';
import {
  AUTH_TOKEN_STORE,
  AuthTokenStore,
} from '../tokens/auth-token-store.token';
import { AUTH_CONFIG, DEFAULT_AUTH_CONFIG } from '../tokens';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router, { optional: true });
  private cookieService = inject(SsrCookieService);
  private tokenKey = inject(AUTH_TOKEN_KEY, { optional: true }) || 'auth_token';
  private authTokenStore =
    inject(AUTH_TOKEN_STORE, { optional: true }) || AuthTokenStore.cookie;
  private authConfig =
    inject(AUTH_CONFIG, { optional: true }) ?? DEFAULT_AUTH_CONFIG;

  private get isBrowser() {
    return isPlatformBrowser(this.platformId);
  }

  private getTokenKey(): string {
    return this.tokenKey || 'auth_token';
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    if (this.authTokenStore === AuthTokenStore.localStorage) {
      if (!this.isBrowser) {
        throw new Error('LocalStorage is not available on the server side.');
      }
    }

    if (!this.isBrowser) {
      return this.cookieService.get(this.getTokenKey());
      //return null;
    }
    try {
      return localStorage.getItem(this.getTokenKey());
    } catch {
      return null;
    }
  }

  setToken(token: string): void {
    if (!this.isBrowser) return;
    try {
      if (
        this.authTokenStore === AuthTokenStore.localStorage ||
        this.authTokenStore === AuthTokenStore.localStorageAndCookie
      ) {
        localStorage.setItem(this.getTokenKey(), token);
      }

      if (
        this.authTokenStore === AuthTokenStore.cookie ||
        this.authTokenStore === AuthTokenStore.localStorageAndCookie
      ) {
        this.cookieService.set(this.getTokenKey(), token, {
          expires: this.authConfig.tokenExpireDays,
          path: '/',
          //domain: undefined,
          secure: this.authConfig.cookieSecure,
          sameSite: 'Strict',
        });
      }
    } catch {
      throw new Error('Failed to store the authentication token.');
    }
  }

  logout(): void {
    if (!this.isBrowser) return;
    try {
      if (
        this.authTokenStore === AuthTokenStore.localStorage ||
        this.authTokenStore === AuthTokenStore.localStorageAndCookie
      ) {
        localStorage.removeItem(this.tokenKey);
      }

      if (
        this.authTokenStore === AuthTokenStore.cookie ||
        this.authTokenStore === AuthTokenStore.localStorageAndCookie
      ) {
        this.cookieService.delete(this.getTokenKey());
      }
    } catch {
      throw new Error('Failed to remove the authentication token.');
    }
  }

  login(
    email: string,
    password: string,
    loginUrl: string,
    redirectUrl: string,
  ) {
    //TODO: KSY encrypt token before storage

    return this.http.post<AuthResponse>(loginUrl, { email, password }).pipe(
      take(1),
      tap((res) => {
        const token = res.accessToken ?? res.AccessToken ?? '';
        this.setToken(token);
        this.redirect(redirectUrl);
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  private redirect(url?: string) {
    if (!this.isBrowser || !url) return;
    const isAbsolute = /^https?:\/\//i.test(url);
    if (!isAbsolute && this.router) {
      void this.router.navigateByUrl(url);
    } else {
      window.location.assign(url);
    }
  }
}

interface AuthResponse {
  accessToken?: string;
  AccessToken?: string;
  expiresAt?: string | Date;
  tokenType?: string;
}
