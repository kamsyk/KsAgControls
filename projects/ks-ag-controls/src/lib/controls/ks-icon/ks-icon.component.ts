import { Component, computed, input } from '@angular/core';
import { KS_ICONS, KsIconName } from './ks-icons';

@Component({
  selector: 'lib-ks-icon',
  standalone: true,
  template: `
    <svg [attr.viewBox]="icon().viewBox" aria-hidden="true" focusable="false">
      <path [attr.d]="icon().path" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      vertical-align: middle;
    }
    svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }
  `,
})
export class KsIconComponent {
  readonly name = input.required<KsIconName>();
  readonly icon = computed(() => {
    const name = this.name();
    const icon = KS_ICONS[name];
    if (!icon) {
      throw new Error(`Unknown Material icon: ${name}`);
    }
    return icon;
  });
}
