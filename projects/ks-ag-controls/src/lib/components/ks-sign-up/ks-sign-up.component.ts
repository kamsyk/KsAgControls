import { Component, computed, inject, input, signal } from '@angular/core';
import {
  FormGroup,
  Validators,
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { GoogleAuthService } from '../../services/google-auth.service';
import { KS_SIGN_UP_TRANSLATIONS, KsSignUpLanguage } from './ks-sign-up.translations';

@Component({
  selector: 'lib-ks-sign-up',
  imports: [MatInputModule, MatFormFieldModule, MatButtonModule, ReactiveFormsModule],
  templateUrl: './ks-sign-up.component.html',
  styleUrl: './ks-sign-up.component.scss',
  host: {
    '[class.ks-sign-up--dark]': "themeMode() === 'dark'",
  },
})
export class KsSignUpComponent {
  language = input<KsSignUpLanguage>('en');
  themeMode = input<'light' | 'dark'>('light');
  googleAuthUrl = input('');
  googleReturnUrl = input('');
  facebookAuthUrl = input('');
  facebookReturnUrl = input('');
  readonly translations = computed(() => KS_SIGN_UP_TRANSLATIONS[this.language()]);
  readonly googleAuthFailed = signal(false);
  readonly facebookAuthFailed = signal(false);

  signUpForm: FormGroup;

  private fb = inject(FormBuilder);
  private googleAuth = inject(GoogleAuthService);

  constructor() {
    this.signUpForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.signUpForm.valid) {
      // Handle sign up logic here
      console.log(this.signUpForm.value);
    }
  }

  signInWith(provider: string) {
    this.googleAuthFailed.set(false);
    this.facebookAuthFailed.set(false);
    if (provider === 'google') {
      try {
        this.googleAuth.start(this.googleAuthUrl(), this.googleReturnUrl());
      } catch (error) {
        console.error('Could not start Google authentication:', error);
        this.googleAuthFailed.set(true);
      }
      return;
    }
    if (provider === 'facebook') {
      try {
        this.googleAuth.startProvider(this.facebookAuthUrl(), this.facebookReturnUrl(), 'Facebook');
      } catch (error) {
        console.error('Could not start Facebook authentication:', error);
        this.facebookAuthFailed.set(true);
      }
      return;
    }
    // Handle OAuth sign-in logic here
    console.log('Sign in with', provider);
  }
}
