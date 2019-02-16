import { FServerModule } from './f-server.module';

describe('FServerModule', () => {
  let fServerModule: FServerModule;

  beforeEach(() => {
    fServerModule = new FServerModule();
  });

  it('should create an instance', () => {
    expect(fServerModule).toBeTruthy();
  });
});
