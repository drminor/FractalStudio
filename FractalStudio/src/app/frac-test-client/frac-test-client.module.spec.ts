import { FracTestClientModule } from './frac-test-client.module';

describe('FracTestClientModule', () => {
  let fracTestClientModule: FracTestClientModule;

  beforeEach(() => {
    fracTestClientModule = new FracTestClientModule();
  });

  it('should create an instance', () => {
    expect(fracTestClientModule).toBeTruthy();
  });
});
