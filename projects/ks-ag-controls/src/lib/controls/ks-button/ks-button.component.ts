import { Component, Input } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'lib-ks-button',
  imports: [MatButtonModule],
  templateUrl: './ks-button.component.html',
  styleUrl: './ks-button.component.scss',
})
export class KsButtonComponent {
  @Input() label = 'Button';
  @Input() variant:
    | 'basic'
    | 'raised'
    | 'stroked'
    | 'flat'
    | 'icon'
    | 'fab'
    | 'mini-fab' = 'raised';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;

  get buttonColor(): 'primary' | 'accent' | 'warn' | null {
    return this.type === 'submit' ? null : this.color;
  }
}
