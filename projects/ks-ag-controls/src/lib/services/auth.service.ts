import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, take, tap } from 'rxjs';
import { Router } from '@angular/router';
import { SsrCookieService } from 'ngx-cookie-service-ssr';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private readonly tokenKey = 'auth_token';
  private router = inject(Router, { optional: true });
  private cookieService = inject(SsrCookieService);

  private get isBrowser() {
    return isPlatformBrowser(this.platformId);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    if (!this.isBrowser) {
      return this.cookieService.get('auth_token');
      //return null;
    }
    try {
      return localStorage.getItem(this.tokenKey);
    } catch {
      return null;
    }
  }

  logout(): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(this.tokenKey);
    } catch {
      void 0;
    }
  }

  login(
    email: string,
    password: string,
    loginUrl: string,
    redirectUrl: string,
  ) {
    return this.http.post<AuthResponse>(loginUrl, { email, password }).pipe(
      take(1),
      tap((res) => {
        if (this.isBrowser) {
          const token = res.accessToken ?? res.AccessToken ?? '';
          localStorage.setItem(this.tokenKey, token);

          this.cookieService.set('auth_token', token, {
            expires: 7, // expires in 7 days
            //path: '/',
            //domain: undefined,
            //secure: true,
            //sameSite: 'Strict'
          });

          // this.cookieService.set(
          //   'auth_token',
          //   token,
          //   7, // expires in 7 days
          //   '/', // path
          //   undefined, // domain (undefined = current domain)
          //   true, // secure (HTTPS only)
          //   'Strict' // SameSite
          // );
        }
        this.redirect(redirectUrl);
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  // private setServerCookie(name: string, value: string, days = 7): void {
  //   if (!this.response) return;

  //   const expires = new Date();
  //   expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  //   const cookieOptions = [
  //     `${name}=${encodeURIComponent(value)}`,
  //     `expires=${expires.toUTCString()}`,
  //     'path=/',
  //     'SameSite=Strict',
  //     'Secure',
  //     'HttpOnly' // Server-side cookies can be HttpOnly for security
  //   ];

  //   this.response.setHeader('Set-Cookie', cookieOptions.join('; '));
  // }

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
