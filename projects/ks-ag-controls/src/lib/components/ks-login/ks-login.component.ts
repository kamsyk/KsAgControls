import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatLabel, MatFormField } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService, LoginRequest } from '../../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatInputModule } from '@angular/material/input';
import { KsButtonComponent } from "../../controls/ks-button/ks-button.component";
import { KS_LOGIN_TRANSLATIONS, KsLoginError, KsLoginLanguage } from './ks-login.translations';

@Component({
  selector: 'lib-ks-login',
  imports: [MatLabel, MatFormField, MatInputModule, ReactiveFormsModule, KsButtonComponent],
  templateUrl: './ks-login.component.html',
  styleUrl: './ks-login.component.css',
})
export class KsLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  loginUrl = input.required<string>();
  redirectUrl = input.required<string>();
  language = input<KsLoginLanguage>('en');

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
