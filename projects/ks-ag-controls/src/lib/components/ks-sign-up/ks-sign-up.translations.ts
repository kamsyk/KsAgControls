export type KsSignUpLanguage = 'cs' | 'en' | 'de';

export interface KsSignUpTranslations {
  username: string;
  usernameRequired: string;
  email: string;
  emailRequired: string;
  invalidEmail: string;
  password: string;
  passwordRequired: string;
  signUp: string;
  signUpWithGoogle: string;
  signUpWithFacebook: string;
  signUpWithMicrosoft: string;
}

export const KS_SIGN_UP_TRANSLATIONS: Record<KsSignUpLanguage, KsSignUpTranslations> = {
  cs: {
    username: 'Uživatelské jméno',
    usernameRequired: 'Uživatelské jméno je povinné',
    email: 'E-mail',
    emailRequired: 'E-mail je povinný',
    invalidEmail: 'Neplatný e-mail',
    password: 'Heslo',
    passwordRequired: 'Heslo je povinné',
    signUp: 'Zaregistrovat se',
    signUpWithGoogle: 'Zaregistrovat se přes Google',
    signUpWithFacebook: 'Zaregistrovat se přes Facebook',
    signUpWithMicrosoft: 'Zaregistrovat se přes Microsoft',
  },
  en: {
    username: 'Username',
    usernameRequired: 'Username is required',
    email: 'Email',
    emailRequired: 'Email is required',
    invalidEmail: 'Invalid email',
    password: 'Password',
    passwordRequired: 'Password is required',
    signUp: 'Sign Up',
    signUpWithGoogle: 'Sign up with Google',
    signUpWithFacebook: 'Sign up with Facebook',
    signUpWithMicrosoft: 'Sign up with Microsoft',
  },
  de: {
    username: 'Benutzername',
    usernameRequired: 'Benutzername ist erforderlich',
    email: 'E-Mail',
    emailRequired: 'E-Mail ist erforderlich',
    invalidEmail: 'Ungültige E-Mail-Adresse',
    password: 'Passwort',
    passwordRequired: 'Passwort ist erforderlich',
    signUp: 'Registrieren',
    signUpWithGoogle: 'Mit Google registrieren',
    signUpWithFacebook: 'Mit Facebook registrieren',
    signUpWithMicrosoft: 'Mit Microsoft registrieren',
  },
};
