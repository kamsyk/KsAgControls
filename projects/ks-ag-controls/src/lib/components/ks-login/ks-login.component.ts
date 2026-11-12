import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatLabel, MatFormField, MatInputModule } from '@angular/material/input';
import { NgClass, NgStyle } from '@angular/common';
import { AuthService, LoginRequest } from '../../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { GoogleAuthService } from '../../services/google-auth.service';
import { KsButtonComponent } from '../../controls/ks-button/ks-button.component';
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './ks-login.component.scss',
})
export class KsLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private googleAuth = inject(GoogleAuthService);
  private readonly loginForm = viewChild<FormGroupDirective>('loginForm');

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
    dialogRef.componentRef?.setInput('microsoftAuthUrl', this.microsoftAuthUrl());
    dialogRef.componentRef?.setInput('microsoftReturnUrl', this.microsoftReturnUrl());
  }

  signInWithGoogle() {
    this.startProviderSignIn(() =>
      this.googleAuth.start(this.googleAuthUrl(), this.googleReturnUrl()),
      'googleAuthError',
      'Could not start Google authentication:',
    );
  }

  signInWithFacebook() {
    this.startProviderSignIn(
      () =>
        this.googleAuth.startProvider(
          this.facebookAuthUrl(),
          this.facebookReturnUrl(),
          'Facebook',
        ),
      'facebookAuthError',
      'Could not start Facebook authentication:',
    );
  }

  signInWithMicrosoft() {
    this.startProviderSignIn(
      () =>
        this.googleAuth.startProvider(
          this.microsoftAuthUrl(),
          this.microsoftReturnUrl(),
          'Microsoft',
        ),
      'microsoftAuthError',
      'Could not start Microsoft authentication:',
    );
  }

  /** Provider login does not use username/password, so clear their validation UI. */
  private clearCredentialValidation(): void {
    const current = this.form.getRawValue();
    this.loginForm()?.resetForm(current);
    this.form.markAsPristine();
    this.form.markAsUntouched();
    for (const control of Object.values(this.form.controls)) {
      control.markAsPristine();
      control.markAsUntouched();
    }
  }

  private startProviderSignIn(
    start: () => void,
    errorKey: KsLoginError,
    errorMessage: string,
  ): void {
    if (this.loading) return;
    this.clearCredentialValidation();
    this.errorKey.set(null);
    try {
      start();
    } catch (error) {
      console.error(errorMessage, error);
      this.errorKey.set(errorKey);
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
