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

### Grid Toolbar Icons

The library uses a local SVG pool of Google Material Symbols Outlined icons (Apache-2.0).
Currently the pool includes `save`. The grid renders it as inline SVG, without an icon font,
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
