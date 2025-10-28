import { InjectionToken } from '@angular/core';

export interface AuthConfig {
  cookieSecure: boolean;
  tokenExpireDays: number;
  encryptionKey?: string;
}

export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG');

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  cookieSecure: false,
  tokenExpireDays: 7,
  encryptionKey: 'default-dev-key',
};
