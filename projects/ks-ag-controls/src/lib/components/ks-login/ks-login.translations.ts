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
}

export type KsLoginError = 'invalidCredentials' | 'loginError' | 'googleAuthError';

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
    googleAuthError: 'Přihlášení přes Google se nepodařilo spustit. Zkontrolujte konfiguraci.',
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
    googleAuthError: 'Could not start Google authentication. Check the configuration.',
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
    googleAuthError: 'Die Google-Anmeldung konnte nicht gestartet werden. Prüfen Sie die Konfiguration.',
  },
};
