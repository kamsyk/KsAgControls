import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KsLoginComponent } from './ks-login.component';

describe('KsLoginComponent', () => {
  let component: KsLoginComponent;
  let fixture: ComponentFixture<KsLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KsLoginComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KsLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
