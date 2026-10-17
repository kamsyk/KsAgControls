import { Component, computed, inject, input } from '@angular/core';
import {
  FormGroup,
  Validators,
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { KS_SIGN_UP_TRANSLATIONS, KsSignUpLanguage } from './ks-sign-up.translations';

@Component({
  selector: 'lib-ks-sign-up',
  imports: [MatInputModule, MatFormFieldModule, MatButtonModule, ReactiveFormsModule],
  templateUrl: './ks-sign-up.component.html',
  styleUrl: './ks-sign-up.component.scss',
})
export class KsSignUpComponent {
  language = input<KsSignUpLanguage>('en');
  readonly translations = computed(() => KS_SIGN_UP_TRANSLATIONS[this.language()]);

  signUpForm: FormGroup;

  private fb = inject(FormBuilder);

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
    // Handle OAuth sign-in logic here
    console.log('Sign in with', provider);
  }
}
