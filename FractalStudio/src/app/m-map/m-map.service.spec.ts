import { TestBed } from '@angular/core/testing';

import { MMapService } from './m-map.service';

describe('MMapService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MMapService = TestBed.get(MMapService);
    expect(service).toBeTruthy();
  });
});
