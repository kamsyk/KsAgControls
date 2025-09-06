import { TestBed } from '@angular/core/testing';

import { KsAgControlsService } from './ks-ag-controls.service';

describe('KsAgControlsService', () => {
  let service: KsAgControlsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KsAgControlsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
