# KsAgControls

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.0.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the library, run:

```bash
npm run build
```

This command will compile your project, and the build artifacts will be placed in the `dist/` directory.

### Library Tailwind Styles

This library precompiles Tailwind styles into `styles/ks-ag-controls.css` during `npm run build`.

In consuming apps, import the packaged stylesheet once in global styles:

```css
@import 'ks-ag-controls/styles/ks-ag-controls.css';
```

If you build only the library entrypoint directly (`ng build ks-ag-controls`), run this first so styles stay in sync:

```bash
npm run build:lib:styles
```

### Grid Layout and Themes

`KsAgGridComponent` uses a unified, rounded layout with a responsive toolbar,
compact row actions, and a wrapping pagination footer. Set `themeMode` to
`'light'` (the default) or `'dark'` to theme the entire grid, including the toolbar,
buttons, headers, rows, and pagination. Theme changes apply at runtime.

```html
<lib-ks-ag-grid
  [rowData]="rows"
  [columnDefs]="columns"
  [enableSettingsPersistence]="true"
  [enableActionButtons]="true"
  [themeMode]="selectedTheme"
/>
```

As before, `enableSettingsPersistence` displays Save Settings, Clear Settings,
and Add New Item. Clear Settings removes the saved settings; it does not reset
the current grid configuration. `enableActionButtons` displays Edit/Delete icons,
replaced by Save/Cancel while editing. With only `enableRowDeletion`, the grid
displays a single Delete icon. Clicking Edit immediately opens all editable cells
in that row and focuses the first editable column. Columns configured with
`editable: false` remain read-only. Save commits the row's open editors before
emitting `rowSaved`; Cancel discards the edits. Without action buttons,
`enableEditing` retains the normal individual-cell editing behavior.

Row action buttons have accessible labels, native title tooltips, visible keyboard
focus, and a minimum 32px target. Tab moves between actions before returning to
grid navigation; Enter or Space activates the focused button. Action columns
are fixed at 104px (Edit/Delete) or 72px (Delete only). Data columns continue to
resize normally. At narrow widths, toolbar controls and pagination wrap while
data columns retain AG Grid's horizontal scrolling. Button transitions respect
the reduced-motion preference.

### Grid Icons

The library uses a local SVG pool of Google Material icons (Apache-2.0).
The pool includes `save`, `edit`, `delete`, `check`, `close`, `add`, and `refresh`.
The grid renders them as inline SVG, without an icon font,
asset URLs, CDN requests, or special `font-src` permissions.

Import `KsIconComponent` in a consuming component's `imports`, then use:

```html
<lib-ks-icon name="save" />
```

Icons inherit the text color and default to 24px. They are decorative (`aria-hidden="true"`),
so give icon-only buttons an accessible label. Add additional SVG geometry to
`src/lib/controls/ks-icon/ks-icons.ts` to extend the local pool.

### Login Language

`KsLoginComponent` accepts a `language` input: `cs` (Czech), `en` (English),
or `de` (German). It defaults to English when omitted. Labels, the submit button,
loading text, and login errors update when the input changes, including an
already displayed error. The `KsLoginLanguage` type is exported for typed bindings.

The Sign up button opens `KsSignUpComponent` in a Material dialog with the
currently selected login language. It is available even when the login form is
empty and disabled while login is in progress. Closing the dialog leaves the
login form unchanged. The registration component currently contains placeholder
password submission; opening it does not
configure a registration API.

```html
<lib-ks-login
  loginUrl="/api/auth/login"
  redirectUrl="/"
  language="cs"
/>
```

### Sign-up Language

`KsSignUpComponent` accepts the same `language` values as login: `cs` (Czech),
`en` (English, the default), or `de` (German). Field labels, validation messages,
and all sign-up buttons update when the input changes. The `KsSignUpLanguage`
type is exported for typed bindings.

```html
<lib-ks-sign-up language="cs" />
```

For dynamic selection, use `[language]="selectedLanguage"`.

The sign-up form uses outlined Angular Material fields and themed Material
buttons in a responsive, single-column layout. It includes a localized heading
and a separate section for provider buttons, and can be used inline or in the
login component's dialog. The consuming app must provide an Angular Material theme.

### Available Authentication Providers

Both `KsLoginComponent` and `KsSignUpComponent` accept a `providers` input:
a readonly array of `'google'`, `'facebook'`, and/or `'microsoft'`. The exported
`KsAuthProvider` type can be used for typed bindings in consuming apps.

```html
<lib-ks-login
  loginUrl="/api/auth/login"
  redirectUrl="/"
  [providers]="['google', 'facebook']"
  googleAuthUrl="/api/auth/google"
  facebookAuthUrl="/api/auth/facebook"
/>

<lib-ks-sign-up
  [providers]="['google']"
  googleAuthUrl="/api/auth/google/register"
/>
```

Omitting `providers` selects all three providers, preserving existing behavior.
Use `[providers]="[]"` to hide the provider section entirely; username/password
forms remain available. Unselected provider buttons are hidden, and changing the
input updates the displayed buttons. Buttons retain the fixed order Google,
Facebook, Microsoft regardless of array order.

Login forwards its selection to the sign-up dialog when opening it. Selection
does not configure endpoints or implement authentication: login still requires
the selected provider's auth URL to show its button, and sign-up disables
all provider buttons without their URLs. This input controls the UI only; backend
authentication policies must be enforced by the consuming app.

### Google Authentication (Backend Redirect)

Both `KsLoginComponent` and `KsSignUpComponent` accept:

| Input | Default | Purpose |
| --- | --- | --- |
| `googleAuthUrl` | `''` | Backend endpoint that initiates Google authentication. Accepts a relative URL or an absolute HTTP(S) URL without embedded credentials. Use HTTPS in production. |
| `googleReturnUrl` | `''` | Optional application destination after authentication, sent as the `returnUrl` query parameter. If empty, the endpoint's existing query/default is left unchanged. This is not Google's OAuth callback URL. |

```html
<lib-ks-login
  loginUrl="/api/auth/login"
  redirectUrl="/"
  googleAuthUrl="https://localhost:7107/api/auth/google"
  googleReturnUrl="/dashboard"
/>

<lib-ks-sign-up
  googleAuthUrl="https://localhost:7107/api/auth/google"
  googleReturnUrl="/dashboard"
/>
```

Login passes both Google inputs into its sign-up dialog. Without `googleAuthUrl`,
login hides its Google button and sign-up disables its existing Google button.
Google authentication does not require valid username/password fields.
Configuration/navigation failures are logged and displayed in the selected language.

The endpoint must accept `returnUrl`, challenge Google, handle Google's callback,
find/create the application user, issue the application session cookie, and
redirect back to an allowlisted destination. Configure the Google **client ID**,
**client secret**, **callback URL**, and **scopes** on the backend, not as component
inputs. Let the backend middleware manage OAuth state/correlation and token
validation; never send secrets or generate OAuth state in these controls.
Register the backend callback in Google Cloud Console, configure consent/test users,
and define safe account creation/linking rules.

After returning, the consuming application must refresh its authentication state
through its backend (for example, `/auth/check` and `/auth/me`). Starting a redirect
does not emit `loginSuccess`. Cross-origin APIs also require appropriate cookie,
CORS, and credentialed-request configuration. No Google browser SDK is required.

### Facebook Authentication (Backend Redirect)

Version 0.0.8 adds `facebookAuthUrl` and `facebookReturnUrl` inputs to both login
and sign-up. They follow the same URL validation and browser-only navigation rules
as the Google inputs. Login hides its Facebook button when no URL is configured;
sign-up disables its Facebook button. Both actions work without a valid password
form and display localized navigation failures in Czech, English, and German.
Login forwards both Facebook inputs to its sign-up dialog. Consuming apps should
replace the dialog's `facebookAuthUrl` with the registration endpoint when login
and registration use different endpoints, just as they do for Google.

```html
<lib-ks-login
  loginUrl="/api/auth/login"
  redirectUrl="/advisor"
  facebookAuthUrl="/api/auth/facebook"
  facebookReturnUrl="/advisor"
/>
<lib-ks-sign-up
  facebookAuthUrl="/api/auth/facebook/register"
  facebookReturnUrl="/advisor"
/>
```

Keep the App ID, App Secret, email permission, callback configuration, OAuth
state validation, and account linking on the backend. No Facebook browser SDK
or access token is used by these controls. The existing `GoogleAuthService.start`
API remains compatible; the shared navigation implementation is available as
`startProvider(url, returnUrl, 'Facebook')`.

### Microsoft Authentication (Backend Redirect)

Both login and, since version 0.0.10, sign-up accept `microsoftAuthUrl` and
`microsoftReturnUrl` inputs (default `''`) with the same URL validation and
browser-only navigation rules as Google and Facebook. The optional return URL is
sent as the `returnUrl` query parameter, not as the OAuth callback URL. Login hides
its Microsoft button when no URL is configured; sign-up disables its button.
Both actions work without a valid password form, and navigation failures are
displayed in Czech, English, and German and cleared on the next provider attempt.
Login forwards both inputs to its sign-up dialog. When login and registration
have separate endpoints, configure the dialog's `microsoftAuthUrl` with the
registration endpoint, as for Google and Facebook.

```html
<lib-ks-login
  loginUrl="/api/auth/login"
  redirectUrl="/advisor"
  microsoftAuthUrl="/api/auth/microsoft"
  microsoftReturnUrl="/advisor"
/>
<lib-ks-sign-up
  microsoftAuthUrl="/api/auth/microsoft/register"
  microsoftReturnUrl="/advisor"
/>
```

Keep the Microsoft Entra ID client ID, client secret, tenant, callback URL, and
account linking on the backend. The navigation is available as
`startProvider(url, returnUrl, 'Microsoft')`.

### Publishing the Library

For local development, run the workspace's install script with the consuming app's directory:

```bat
scripts\install-local.bat "D:\path\to\client-app"
```

This builds the library and styles, packs the current version, and installs that tarball.
It replaces an existing installation without first uninstalling the library.

Once the project is built, you can publish your library by following these steps:

1. Navigate to the `dist` directory:

   ```bash
   cd dist/ks-ag-controls
   ```

2. Run the `npm publish` command to publish your library to the npm registry:
   ```bash
   npm publish
   ```

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
