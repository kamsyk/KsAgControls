import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  start(authUrl: string, returnUrl: string): void {
    if (!isPlatformBrowser(this.platformId) || !this.document.defaultView) {
      throw new Error('Google authentication requires a browser.');
    }
    if (!authUrl.trim()) {
      throw new Error('A backend Google authentication URL is required.');
    }

    const url = new URL(authUrl, this.document.baseURI);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('The Google authentication URL must be an HTTP(S) URL without credentials.');
    }
    if (returnUrl) {
      url.searchParams.set('returnUrl', returnUrl);
    }
    this.document.defaultView.location.assign(url.href);
  }
}
