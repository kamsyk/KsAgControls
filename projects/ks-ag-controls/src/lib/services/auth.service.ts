import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, catchError, map, of } from 'rxjs';

export interface User {
  username: string;
  fullName: string;
  userId: string;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    username: string;
    fullName: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  //private readonly API_BASE = 'https://localhost:7107/api';
  private readonly API_BASE = 'http://localhost:5026/api';

  // Using signals for reactive state management
  public isAuthenticated = signal<boolean>(false);
  public currentUser = signal<User | null>(null);

  // For backwards compatibility with observables
  private authStateSubject = new BehaviorSubject<boolean>(false);
  public authState$ = this.authStateSubject.asObservable();

  constructor() {
    this.checkAuthStatus();
  }

  login(credentials: LoginRequest, loginUrl: string, redirectUrl: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(loginUrl, credentials)
      .pipe(
        map(response => {
          if (response.success && response.user) {
            this.setAuthState(true);
            this.getCurrentUser().subscribe(); // Fetch full user details
          }
          return response;
        }),
        catchError(error => {
          console.error('Login error:', error);
          this.setAuthState(false);
          return of({ success: false, message: 'Login failed' });
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.API_BASE}/auth/logout`, {})
      .pipe(
        map(() => {
          this.setAuthState(false);
          this.currentUser.set(null);
          this.router.navigate(['/login']);
          return { success: true };
        }),
        catchError(error => {
          console.error('Logout error:', error);
          // Even if logout fails on server, clear local state
          this.setAuthState(false);
          this.currentUser.set(null);
          this.router.navigate(['/login']);
          return of({ success: true });
        })
      );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_BASE}/auth/me`)
      .pipe(
        map(user => {
          this.currentUser.set(user);
          this.setAuthState(true);
          return user;
        }),
        catchError(error => {
          console.error('Get current user error:', error);
          this.setAuthState(false);
          this.currentUser.set(null);
          throw error;
        })
      );
  }

  checkAuthStatus(): Observable<{isAuthenticated: boolean, username?: string}> {
    return this.http.get<{isAuthenticated: boolean, username?: string}>(`${this.API_BASE}/auth/check`)
      .pipe(
        map(response => {
          this.setAuthState(response.isAuthenticated);
          if (response.isAuthenticated) {
            this.getCurrentUser().subscribe();
          } else {
            this.currentUser.set(null);
          }
          return response;
        }),
        catchError(error => {
          console.error('Auth check error:', error);
          this.setAuthState(false);
          this.currentUser.set(null);
          return of({ isAuthenticated: false });
        })
      );
  }

  private setAuthState(isAuth: boolean): void {
    this.isAuthenticated.set(isAuth);
    this.authStateSubject.next(isAuth);
  }

  // Method to get protected data (example)
  getProtectedData(): Observable<any> {
    return this.http.get(`${this.API_BASE}/data/protected`);
  }

  getUserSpecificData(): Observable<any> {
    return this.http.get(`${this.API_BASE}/data/user-specific`);
  }

  getPublicData(): Observable<any> {
    return this.http.get(`${this.API_BASE}/data/public`);
  }
}
