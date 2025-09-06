import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KsAgControlsComponent } from './ks-ag-controls.component';

describe('KsAgControlsComponent', () => {
  let component: KsAgControlsComponent;
  let fixture: ComponentFixture<KsAgControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KsAgControlsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KsAgControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
