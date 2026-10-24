import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatLabel, MatFormField } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { NgClass, NgStyle } from '@angular/common';
import { AuthService, LoginRequest } from '../../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { GoogleAuthService } from '../../services/google-auth.service';
import { KsButtonComponent } from "../../controls/ks-button/ks-button.component";
import { KsSignUpComponent } from '../ks-sign-up/ks-sign-up.component';
import { KS_LOGIN_TRANSLATIONS, KsLoginError, KsLoginLanguage } from './ks-login.translations';
import { KsAuthProvider } from '../ks-auth-provider';

/** Theme mode controlled by the parent app. */
export type KsLoginThemeMode = 'light' | 'dark';

/** Inline CSS properties / custom properties passed from the parent app. */
export type KsLoginStyles = Record<string, string>;

@Component({
  selector: 'lib-ks-login',
  imports: [
    MatLabel,
    MatFormField,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    KsButtonComponent,
    NgClass,
    NgStyle,
  ],
  templateUrl: './ks-login.component.html',
  styleUrl: './ks-login.component.scss',
})
export class KsLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private googleAuth = inject(GoogleAuthService);

  loginUrl = input.required<string>();
  redirectUrl = input.required<string>();
  language = input<KsLoginLanguage>('en');
  providers = input<readonly KsAuthProvider[]>(['google', 'facebook', 'microsoft']);
  googleAuthUrl = input('');
  googleReturnUrl = input('');
  facebookAuthUrl = input('');
  facebookReturnUrl = input('');
  microsoftAuthUrl = input('');
  microsoftReturnUrl = input('');

  /** Parent-driven light/dark mode. */
  themeMode = input<KsLoginThemeMode>('light');

  /** Extra CSS class(es) from the parent. */
  hostClass = input<string | string[] | Set<string> | Record<string, boolean> | null>(null, {
    alias: 'class',
  });

  /**
   * Styles from the parent app (inline CSS + custom properties).
   * Example: `{ '--ks-login-error': '#ff6b6b', 'padding': '1rem' }`
   */
  styles = input<KsLoginStyles | null>(null);

  readonly translations = computed(() => KS_LOGIN_TRANSLATIONS[this.language()]);

  loginSuccess = output<{ username: string }>();

  loading = false;
  private errorKey = signal<KsLoginError | null>(null);

  get error(): string {
    const key = this.errorKey();
    return key ? this.translations()[key] : '';
  }

  form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  openSignUp() {
    const dialogRef = this.dialog.open(KsSignUpComponent, {
      width: '640px',
      ariaLabel: this.translations().signUp,
      panelClass: this.themeMode() === 'dark' ? 'ks-login-dialog--dark' : undefined,
    });
    dialogRef.componentRef?.setInput('language', this.language());
    dialogRef.componentRef?.setInput('themeMode', this.themeMode());
    dialogRef.componentRef?.setInput('providers', this.providers());
    dialogRef.componentRef?.setInput('googleAuthUrl', this.googleAuthUrl());
    dialogRef.componentRef?.setInput('googleReturnUrl', this.googleReturnUrl());
    dialogRef.componentRef?.setInput('facebookAuthUrl', this.facebookAuthUrl());
    dialogRef.componentRef?.setInput('facebookReturnUrl', this.facebookReturnUrl());
  }

  signInWithGoogle() {
    if (this.loading) return;
    this.errorKey.set(null);
    try {
      this.googleAuth.start(this.googleAuthUrl(), this.googleReturnUrl());
    } catch (error) {
      console.error('Could not start Google authentication:', error);
      this.errorKey.set('googleAuthError');
    }
  }

  signInWithFacebook() {
    if (this.loading) return;
    this.errorKey.set(null);
    try {
      this.googleAuth.startProvider(this.facebookAuthUrl(), this.facebookReturnUrl(), 'Facebook');
    } catch (error) {
      console.error('Could not start Facebook authentication:', error);
      this.errorKey.set('facebookAuthError');
    }
  }

  signInWithMicrosoft() {
    if (this.loading) return;
    this.errorKey.set(null);
    try {
      this.googleAuth.startProvider(this.microsoftAuthUrl(), this.microsoftReturnUrl(), 'Microsoft');
    } catch (error) {
      console.error('Could not start Microsoft authentication:', error);
      this.errorKey.set('microsoftAuthError');
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorKey.set(null);
    const { username, password } = this.form.value as {
      username: string;
      password: string;
    };

    const loginRequest: LoginRequest = {
      username: username,
      password: password
    };

    this.authService
      .login(loginRequest, this.loginUrl())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ok) => {
          this.loading = false;
          if (ok.success) {
            this.loginSuccess.emit({
              username,
            });
            if(this.redirectUrl()) {
              window.location.href = this.redirectUrl();
            }
          } else {
            this.errorKey.set('invalidCredentials');
          }
        },
        error: () => {
          this.loading = false;
          this.errorKey.set('loginError');
        },
      });
  }
}
