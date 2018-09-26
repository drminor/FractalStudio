import { Injectable, ModuleWithProviders } from '@angular/core';

@Injectable(
  //{
  //  providedIn: 'root'
  //}
)
export class SampleService {
  //static forRoot(): ModuleWithProviders {
  //  return {
  //    ngModule: SampleService,
  //    providers: [SampleService]
  //  };
  //}
  doInterations(x: number): number {
    return 5;
  }
}
