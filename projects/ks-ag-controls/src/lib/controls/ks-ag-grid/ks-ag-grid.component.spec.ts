import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KsAgGridComponent } from './ks-ag-grid.component';

describe('KsAgGridComponent', () => {
  let component: KsAgGridComponent;
  let fixture: ComponentFixture<KsAgGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KsAgGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KsAgGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
