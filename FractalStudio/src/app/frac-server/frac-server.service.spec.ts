import { TestBed } from '@angular/core/testing';

import { FracServerService } from './frac-server.service';

describe('FracServerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FracServerService = TestBed.get(FracServerService);
    expect(service).toBeTruthy();
  });
});
