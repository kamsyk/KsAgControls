import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GoogleAuthService } from './google-auth.service';

describe('GoogleAuthService', () => {
  const assign = vi.fn();

  beforeEach(() => {
    assign.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: DOCUMENT,
          useValue: {
            baseURI: 'https://app.example.com/',
            defaultView: { location: { assign } },
          },
        },
      ],
    });
  });

  it('navigates to the backend with an encoded return URL and preserves other parameters', () => {
    TestBed.inject(GoogleAuthService).start(
      'https://api.example.com/auth/google?tenant=example&returnUrl=old',
      '/dashboard?tab=profile&next=/',
    );
    const url = new URL(assign.mock.calls[0][0]);
    expect(url.origin).toBe('https://api.example.com');
    expect(url.searchParams.get('tenant')).toBe('example');
    expect(url.searchParams.getAll('returnUrl')).toEqual(['/dashboard?tab=profile&next=/']);
  });

  it('resolves a relative endpoint and leaves its return URL intact when omitted', () => {
    TestBed.inject(GoogleAuthService).start('/auth/google?returnUrl=%2Fhome', '');
    expect(assign).toHaveBeenCalledWith('https://app.example.com/auth/google?returnUrl=%2Fhome');
  });

  it.each([
    '',
    '   ',
    'javascript:alert(1)',
    'data:text/html,test',
    'https://user:secret@api.example.com',
    'https://[',
  ])('rejects invalid endpoint %s without navigation', (endpoint) => {
    expect(() => TestBed.inject(GoogleAuthService).start(endpoint, '')).toThrow();
    expect(assign).not.toHaveBeenCalled();
  });

  it('does not attempt navigation on the server', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    expect(() => TestBed.inject(GoogleAuthService).start('/auth/google', '')).toThrow(/browser/);
    expect(assign).not.toHaveBeenCalled();
  });
});
