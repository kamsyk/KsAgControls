export type KsLoginLanguage = 'cs' | 'en' | 'de';

export interface KsLoginTranslations {
  signIn: string;
  signUp: string;
  username: string;
  password: string;
  signingIn: string;
  invalidCredentials: string;
  loginError: string;
  signInWithGoogle: string;
  googleAuthError: string;
  signInWithFacebook: string;
  facebookAuthError: string;
  signInWithMicrosoft: string;
  microsoftAuthError: string;
}

export type KsLoginError =
  | 'invalidCredentials'
  | 'loginError'
  | 'googleAuthError'
  | 'facebookAuthError'
  | 'microsoftAuthError';

export const KS_LOGIN_TRANSLATIONS: Record<KsLoginLanguage, KsLoginTranslations> = {
  cs: {
    signIn: 'Přihlásit se',
    signUp: 'Registrovat se',
    username: 'Uživatelské jméno / E-mail',
    password: 'Heslo',
    signingIn: 'Přihlašování…',
    invalidCredentials: 'Neplatné přihlašovací údaje',
    loginError: 'Při přihlašování došlo k chybě',
    signInWithGoogle: 'Přihlásit se přes Google',
    signInWithFacebook: 'Přihlásit se přes Facebook',
    facebookAuthError: 'Přihlášení přes Facebook se nepodařilo spustit. Zkontrolujte konfiguraci.',
    googleAuthError: 'Přihlášení přes Google se nepodařilo spustit. Zkontrolujte konfiguraci.',
    signInWithMicrosoft: 'Přihlásit se přes Microsoft',
    microsoftAuthError: 'Přihlášení přes Microsoft se nepodařilo spustit. Zkontrolujte konfiguraci.',
  },
  en: {
    signIn: 'Sign in',
    signUp: 'Sign up',
    username: 'User Name / Email',
    password: 'Password',
    signingIn: 'Signing in…',
    invalidCredentials: 'Invalid credentials',
    loginError: 'An error occurred during login',
    signInWithGoogle: 'Sign in with Google',
    signInWithFacebook: 'Sign in with Facebook',
    facebookAuthError: 'Could not start Facebook authentication. Check the configuration.',
    googleAuthError: 'Could not start Google authentication. Check the configuration.',
    signInWithMicrosoft: 'Sign in with Microsoft',
    microsoftAuthError: 'Could not start Microsoft authentication. Check the configuration.',
  },
  de: {
    signIn: 'Anmelden',
    signUp: 'Registrieren',
    username: 'Benutzername / E-Mail',
    password: 'Passwort',
    signingIn: 'Anmeldung läuft…',
    invalidCredentials: 'Ungültige Anmeldedaten',
    loginError: 'Bei der Anmeldung ist ein Fehler aufgetreten',
    signInWithGoogle: 'Mit Google anmelden',
    signInWithFacebook: 'Mit Facebook anmelden',
    facebookAuthError: 'Die Facebook-Anmeldung konnte nicht gestartet werden. Prüfen Sie die Konfiguration.',
    googleAuthError: 'Die Google-Anmeldung konnte nicht gestartet werden. Prüfen Sie die Konfiguration.',
    signInWithMicrosoft: 'Mit Microsoft anmelden',
    microsoftAuthError: 'Die Microsoft-Anmeldung konnte nicht gestartet werden. Prüfen Sie die Konfiguration.',
  },
};
