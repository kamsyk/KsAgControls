import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KsSignUpComponent } from './ks-sign-up.component';

describe('KsSignUpComponent', () => {
  let component: KsSignUpComponent;
  let fixture: ComponentFixture<KsSignUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KsSignUpComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KsSignUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
