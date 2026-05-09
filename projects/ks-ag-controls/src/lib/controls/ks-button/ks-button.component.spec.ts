import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KsButtonComponent } from './ks-button.component';

describe('KsButtonComponent', () => {
  let component: KsButtonComponent;
  let fixture: ComponentFixture<KsButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KsButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KsButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
