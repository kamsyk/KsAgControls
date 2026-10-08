export type KsLoginLanguage = 'cs' | 'en' | 'de';

export interface KsLoginTranslations {
  signIn: string;
  username: string;
  password: string;
  signingIn: string;
  invalidCredentials: string;
  loginError: string;
}

export type KsLoginError = 'invalidCredentials' | 'loginError';

export const KS_LOGIN_TRANSLATIONS: Record<KsLoginLanguage, KsLoginTranslations> = {
  cs: {
    signIn: 'Přihlásit se',
    username: 'Uživatelské jméno / E-mail',
    password: 'Heslo',
    signingIn: 'Přihlašování…',
    invalidCredentials: 'Neplatné přihlašovací údaje',
    loginError: 'Při přihlašování došlo k chybě',
  },
  en: {
    signIn: 'Sign in',
    username: 'User Name / Email',
    password: 'Password',
    signingIn: 'Signing in…',
    invalidCredentials: 'Invalid credentials',
    loginError: 'An error occurred during login',
  },
  de: {
    signIn: 'Anmelden',
    username: 'Benutzername / E-Mail',
    password: 'Passwort',
    signingIn: 'Anmeldung läuft…',
    invalidCredentials: 'Ungültige Anmeldedaten',
    loginError: 'Bei der Anmeldung ist ein Fehler aufgetreten',
  },
};
