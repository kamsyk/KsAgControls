import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'lib-ks-text-field',
  imports: [MatInputModule, FormsModule],
  templateUrl: './ks-text-field.component.html',
  styleUrl: './ks-text-field.component.css'
})
export class KsTextFieldComponent {
  username = '';
}
