import { EyeCanModule } from './eye-can.module';

describe('EyeCanModule', () => {
  let eyeCanModule: EyeCanModule;

  beforeEach(() => {
    eyeCanModule = new EyeCanModule();
  });

  it('should create an instance', () => {
    expect(eyeCanModule).toBeTruthy();
  });
});
