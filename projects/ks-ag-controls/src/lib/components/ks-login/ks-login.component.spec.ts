import { ComponentFixture, TestBed } from '@angular/core/testing';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { KsLoginComponent } from './ks-login.component';
import { AuthService, LoginResponse } from '../../services/auth.service';
import { KsLoginLanguage } from './ks-login.translations';
import { KsSignUpComponent } from '../ks-sign-up/ks-sign-up.component';

describe('KsLoginComponent', () => {
  let component: KsLoginComponent;
  let fixture: ComponentFixture<KsLoginComponent>;
  const login = vi.fn();

  beforeEach(async () => {
    login.mockReset();
    await TestBed.configureTestingModule({
      imports: [KsLoginComponent],
      providers: [{ provide: AuthService, useValue: { login } }],
    }).compileComponents();

    fixture = TestBed.createComponent(KsLoginComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('loginUrl', '/api/auth/login');
    fixture.componentRef.setInput('redirectUrl', '');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('applies light theme by default and dark theme from the parent', () => {
    const root: HTMLElement = fixture.nativeElement.querySelector('.ks-login');
    expect(root.classList.contains('ks-login--dark')).toBe(false);

    fixture.componentRef.setInput('themeMode', 'dark');
    fixture.detectChanges();
    expect(root.classList.contains('ks-login--dark')).toBe(true);
  });

  it('applies styles passed from the parent', () => {
    fixture.componentRef.setInput('styles', {
      '--ks-login-error': 'rgb(255, 0, 0)',
      padding: '12px',
    });
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement.querySelector('.ks-login');
    expect(root.style.getPropertyValue('--ks-login-error')).toBe('rgb(255, 0, 0)');
    expect(root.style.padding).toBe('12px');
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
  });

  it('defaults to English', () => {
    expect(component.language()).toBe('en');
    expect(fixture.nativeElement.querySelector('h2').textContent).toBe('Sign in');
    expect(fixture.nativeElement.querySelector('button').textContent).toBe('Sign in');
    expect(component.error).toBe('');
  });

  const languages: {
    language: KsLoginLanguage;
    signIn: string;
    signUp: string;
    username: string;
    password: string;
    signingIn: string;
    invalidCredentials: string;
    loginError: string;
  }[] = [
    {
      language: 'cs',
      signIn: 'Přihlásit se',
      signUp: 'Registrovat se',
      username: 'Uživatelské jméno / E-mail',
      password: 'Heslo',
      signingIn: 'Přihlašování…',
      invalidCredentials: 'Neplatné přihlašovací údaje',
      loginError: 'Při přihlašování došlo k chybě',
    },
    {
      language: 'en',
      signIn: 'Sign in',
      signUp: 'Sign up',
      username: 'User Name / Email',
      password: 'Password',
      signingIn: 'Signing in…',
      invalidCredentials: 'Invalid credentials',
      loginError: 'An error occurred during login',
    },
    {
      language: 'de',
      signIn: 'Anmelden',
      signUp: 'Registrieren',
      username: 'Benutzername / E-Mail',
      password: 'Passwort',
      signingIn: 'Anmeldung läuft…',
      invalidCredentials: 'Ungültige Anmeldedaten',
      loginError: 'Bei der Anmeldung ist ein Fehler aufgetreten',
    },
  ];

  for (const text of languages) {
    it(`opens sign-up in ${text.language} without submitting login`, async () => {
      fixture.componentRef.setInput('language', text.language);
      fixture.detectChanges();
      const button: HTMLButtonElement =
        fixture.nativeElement.querySelector('button[type="button"]');
      expect(button.textContent).toBe(text.signUp);
      expect(button.disabled).toBe(false);

      button.click();
      fixture.detectChanges();

      const dialogs = TestBed.inject(MatDialog).openDialogs;
      expect(dialogs).toHaveLength(1);
      expect(dialogs[0].componentInstance).toBeInstanceOf(KsSignUpComponent);
      expect(dialogs[0].componentInstance.language()).toBe(text.language);
      expect(document.querySelector('mat-dialog-container')?.getAttribute('aria-label'))
        .toBe(text.signUp);
      expect(document.querySelector('lib-ks-sign-up button[type="submit"]')?.textContent?.trim())
        .toBe(dialogs[0].componentInstance.translations().signUp);
      expect(login).not.toHaveBeenCalled();

      const closed = firstValueFrom(dialogs[0].afterClosed());
      dialogs[0].close();
      await closed;
      fixture.detectChanges();
      expect(TestBed.inject(MatDialog).openDialogs).toHaveLength(0);
      expect(component.form.value).toEqual({ username: '', password: '' });
    });

    it(`translates labels, loading, and failed credentials in ${text.language}`, () => {
      fixture.componentRef.setInput('language', text.language);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('h2').textContent).toBe(text.signIn);
      const labels = fixture.nativeElement.querySelectorAll('mat-label');
      expect(labels[0].textContent).toBe(text.username);
      expect(labels[1].textContent).toBe(text.password);
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
      expect(button.textContent).toBe(text.signIn);
      expect(button.disabled).toBe(true);

      const response = new Subject<LoginResponse>();
      login.mockReturnValue(response);
      const success = vi.fn();
      component.loginSuccess.subscribe(success);
      component.form.setValue({ username: 'user', password: 'password' });
      component.submit();
      fixture.detectChanges();

      expect(login).toHaveBeenCalledWith(
        { username: 'user', password: 'password' },
        '/api/auth/login',
      );
      expect(button.textContent).toBe(text.signingIn);
      expect(button.disabled).toBe(true);
      expect(fixture.nativeElement.querySelector('button[type="button"]').disabled).toBe(true);

      response.next({ success: false, message: 'Login failed' });
      response.complete();
      fixture.detectChanges();

      expect(component.error).toBe(text.invalidCredentials);
      expect(fixture.nativeElement.textContent).toContain(text.invalidCredentials);
      expect(button.textContent).toBe(text.signIn);
      expect(button.disabled).toBe(false);
      expect(fixture.nativeElement.querySelector('button[type="button"]').disabled).toBe(false);
      expect(success).not.toHaveBeenCalled();
    });

    it(`translates login errors in ${text.language}`, () => {
      fixture.componentRef.setInput('language', text.language);
      login.mockReturnValue(throwError(() => new Error('Network failure')));
      component.form.setValue({ username: 'user', password: 'password' });
      component.submit();
      fixture.detectChanges();

      expect(component.loading).toBe(false);
      expect(component.error).toBe(text.loginError);
      expect(fixture.nativeElement.textContent).toContain(text.loginError);
    });
  }

  it('retranslates an existing error when the language changes and clears it on retry', () => {
    login.mockReturnValue(of({ success: false, message: 'Login failed' }));
    component.form.setValue({ username: 'user', password: 'password' });
    component.submit();
    expect(component.error).toBe('Invalid credentials');

    fixture.componentRef.setInput('language', 'cs');
    fixture.detectChanges();
    expect(component.error).toBe('Neplatné přihlašovací údaje');
    expect(fixture.nativeElement.textContent).not.toContain('Invalid credentials');

    const response = new Subject<LoginResponse>();
    login.mockReturnValue(response);
    component.submit();
    expect(component.error).toBe('');
    response.complete();
  });

  it('does not submit an invalid form', () => {
    component.submit();
    expect(login).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('emits the username on successful login', () => {
    const success = vi.fn();
    component.loginSuccess.subscribe(success);
    login.mockReturnValue(of({ success: true, message: 'OK' }));
    component.form.setValue({ username: 'user', password: 'password' });
    component.submit();

    expect(success).toHaveBeenCalledWith({ username: 'user' });
    expect(component.loading).toBe(false);
    expect(component.error).toBe('');
  });
});
