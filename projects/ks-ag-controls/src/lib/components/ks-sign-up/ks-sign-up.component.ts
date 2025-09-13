import { Component, inject } from '@angular/core';
import {
  FormGroup,
  Validators,
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'lib-ks-sign-up',
  imports: [MatInputModule, MatFormFieldModule, ReactiveFormsModule],
  templateUrl: './ks-sign-up.component.html',
  styleUrl: './ks-sign-up.component.css',
})
export class KsSignUpComponent {
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
