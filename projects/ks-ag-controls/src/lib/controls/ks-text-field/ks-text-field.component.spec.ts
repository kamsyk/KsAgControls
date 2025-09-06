import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KsTextFieldComponent } from './ks-text-field.component';

describe('KsTextFieldComponent', () => {
  let component: KsTextFieldComponent;
  let fixture: ComponentFixture<KsTextFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KsTextFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KsTextFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
