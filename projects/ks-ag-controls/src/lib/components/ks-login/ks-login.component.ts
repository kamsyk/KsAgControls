import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatLabel, MatFormField } from "@angular/material/input";
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lib-ks-login',
  imports: [MatLabel, MatFormField, ReactiveFormsModule],
  templateUrl: './ks-login.component.html',
  styleUrl: './ks-login.component.css'
})
export class KsLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  loading = false;
  error = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.value as { email: string; password: string };
    this.authService.login(email, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ok) => {
          this.loading = false;
          if (ok) {
            // success
          } else {
            this.error = 'Invalid credentials';
          }
        },
        error: () => {
          this.loading = false;
          this.error = 'An error occurred during login';
        }
      });

  }
}
