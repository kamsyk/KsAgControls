import { Component } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'sc-ks-text-field',
  imports: [MatInputModule, FormsModule],
  templateUrl: './ks-text-field.component.html',
  styleUrl: './ks-text-field.component.css',
})
export class KsTextFieldComponent {
  username = '';
}
