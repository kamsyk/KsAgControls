import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KsSignUpComponent } from './ks-sign-up.component';
import { KsSignUpLanguage } from './ks-sign-up.translations';
import { MatButton } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { By } from '@angular/platform-browser';

describe('KsSignUpComponent', () => {
  let component: KsSignUpComponent;
  let fixture: ComponentFixture<KsSignUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KsSignUpComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KsSignUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults to English', () => {
    expect(component.language()).toBe('en');
    expect(fixture.nativeElement.querySelector('button[type="submit"]').textContent.trim())
      .toBe('Sign Up');
  });

  it('uses outlined Material fields and styled Material buttons', () => {
    const fields = fixture.debugElement.queryAll(By.directive(MatFormField));
    expect(fields).toHaveLength(3);
    fields.forEach((field) => {
      expect(field.injector.get(MatFormField).appearance).toBe('outline');
    });
    expect(fixture.debugElement.queryAll(By.directive(MatButton))).toHaveLength(4);
    expect(fixture.nativeElement.querySelector('h2').textContent).toBe('Sign Up');
    expect(fixture.nativeElement.querySelector('input[formControlName="password"]').autocomplete)
      .toBe('new-password');
  });

  const languages: {
    language: KsSignUpLanguage;
    labels: string[];
    requiredErrors: string[];
    invalidEmail: string;
    buttons: string[];
  }[] = [
    {
      language: 'cs',
      labels: ['Uživatelské jméno', 'E-mail', 'Heslo'],
      requiredErrors: [
        'Uživatelské jméno je povinné',
        'E-mail je povinný',
        'Heslo je povinné',
      ],
      invalidEmail: 'Neplatný e-mail',
      buttons: [
        'Zaregistrovat se',
        'Zaregistrovat se přes Google',
        'Zaregistrovat se přes Facebook',
        'Zaregistrovat se přes Microsoft',
      ],
    },
    {
      language: 'en',
      labels: ['Username', 'Email', 'Password'],
      requiredErrors: ['Username is required', 'Email is required', 'Password is required'],
      invalidEmail: 'Invalid email',
      buttons: [
        'Sign Up',
        'Sign up with Google',
        'Sign up with Facebook',
        'Sign up with Microsoft',
      ],
    },
    {
      language: 'de',
      labels: ['Benutzername', 'E-Mail', 'Passwort'],
      requiredErrors: [
        'Benutzername ist erforderlich',
        'E-Mail ist erforderlich',
        'Passwort ist erforderlich',
      ],
      invalidEmail: 'Ungültige E-Mail-Adresse',
      buttons: [
        'Registrieren',
        'Mit Google registrieren',
        'Mit Facebook registrieren',
        'Mit Microsoft registrieren',
      ],
    },
  ];

  function texts(selector: string): string[] {
    const elements: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll(selector);
    return Array.from(elements, (element) => element.textContent?.trim() ?? '');
  }

  for (const text of languages) {
    it(`translates labels, buttons, and validation errors in ${text.language}`, () => {
      fixture.componentRef.setInput('language', text.language);
      component.signUpForm.markAllAsTouched();
      fixture.detectChanges();

      expect(texts('mat-label')).toEqual(text.labels);
      expect(texts('h2')).toEqual([text.buttons[0]]);
      expect(texts('button')).toEqual(text.buttons);
      expect(texts('mat-error')).toEqual(text.requiredErrors);

      component.signUpForm.get('email')?.setValue('invalid');
      fixture.detectChanges();
      expect(texts('mat-error')).toEqual([
        text.requiredErrors[0],
        text.invalidEmail,
        text.requiredErrors[2],
      ]);
    });
  }

  it('updates already displayed validation errors when the language changes', () => {
    component.signUpForm.markAllAsTouched();
    component.signUpForm.get('email')?.setValue('invalid');
    fixture.detectChanges();
    expect(texts('mat-error')).toContain('Invalid email');

    fixture.componentRef.setInput('language', 'cs');
    fixture.detectChanges();
    expect(texts('mat-error')).toEqual([
      'Uživatelské jméno je povinné',
      'Neplatný e-mail',
      'Heslo je povinné',
    ]);
    expect(component.signUpForm.get('email')?.value).toBe('invalid');
    expect(component.signUpForm.touched).toBe(true);
  });

  it('preserves form validation and submission', () => {
    fixture.componentRef.setInput('language', 'de');
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBe(true);

    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      component.onSubmit();
      expect(log).not.toHaveBeenCalled();
      const values = { username: 'user', email: 'user@example.com', password: 'password' };
      component.signUpForm.setValue(values);
      fixture.detectChanges();
      expect(button.disabled).toBe(false);
      button.click();
      expect(log).toHaveBeenCalledWith(values);
    } finally {
      log.mockRestore();
    }
  });

  it('preserves OAuth provider actions with translated buttons', () => {
    fixture.componentRef.setInput('language', 'cs');
    fixture.detectChanges();
    const signInWith = vi.spyOn(component, 'signInWith').mockImplementation(() => undefined);
    try {
      const buttons: NodeListOf<HTMLButtonElement> =
        fixture.nativeElement.querySelectorAll('button[mat-stroked-button]');
      buttons.forEach((button) => button.click());
      expect(signInWith.mock.calls).toEqual([['google'], ['facebook'], ['microsoft']]);
    } finally {
      signInWith.mockRestore();
    }
  });
});
