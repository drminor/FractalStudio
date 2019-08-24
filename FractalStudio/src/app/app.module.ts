import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { MMapModule } from './m-map/m-map.module';

import { FracTestClientModule } from './frac-test-client/frac-test-client.module';
import { HttpClientModule } from '@angular/common/http';
import { EyeCanModule } from './eye-can/eye-can.module';


@NgModule({
  imports: [
    BrowserModule,
    MMapModule,
    EyeCanModule,
    FracTestClientModule,
    HttpClientModule
  ],
  declarations: [
    AppComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
