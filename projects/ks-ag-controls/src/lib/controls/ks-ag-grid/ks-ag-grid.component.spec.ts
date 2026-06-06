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

  it('should use light theme mode by default', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-ag-theme-mode')).toBe('light');
  });

  it('should use dark theme mode when darkMode is true', () => {
    component.darkMode = true;
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-ag-theme-mode')).toBe('dark');
  });

  it('should prefer themeMode over darkMode', () => {
    component.darkMode = true;
    component.themeMode = 'dark-blue';
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-ag-theme-mode')).toBe('dark-blue');
  });
});
