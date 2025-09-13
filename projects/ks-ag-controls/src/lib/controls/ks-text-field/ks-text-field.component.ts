import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { BaseControl } from '../base-control';

@Component({
  selector: 'lib-ks-text-field',
  imports: [MatInputModule, FormsModule],
  templateUrl: './ks-text-field.component.html',
  styleUrl: './ks-text-field.component.css',
  standalone: true,
})
export class KsTextFieldComponent extends BaseControl {
  username = '';
}
