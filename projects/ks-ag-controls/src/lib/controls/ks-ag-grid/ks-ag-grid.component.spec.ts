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
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use light theme mode by default', () => {
    expect(component.gridClass).toBe('ag-theme-quartz');
  });

  it('should use dark theme mode when themeMode is dark', () => {
    component.themeMode = 'dark';
    fixture.detectChanges();

    expect(component.gridClass).toBe('ag-theme-quartz-dark');
  });

  it('should preserve custom grid classes with the selected theme', () => {
    component.themeMode = 'dark';
    component.class = 'custom-grid';
    fixture.detectChanges();

    expect(component.gridClass).toBe('ag-theme-quartz-dark custom-grid');
  });
});
