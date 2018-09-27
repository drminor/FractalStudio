import { MMapModule } from './m-map.module';

describe('MmapModule', () => {
  let mMapModule: MMapModule;

  beforeEach(() => {
    mMapModule = new MMapModule();
  });

  it('should create an instance', () => {
    expect(mMapModule).toBeTruthy();
  });
});
