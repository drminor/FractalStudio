import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { MMapModule } from './m-map/m-map.module';

//import { FServerModule } from './frac-server/f-server.module';


import { FracTestClientModule } from './frac-test-client/frac-test-client.module';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  imports: [
    BrowserModule,
    MMapModule,
    FracTestClientModule,
    HttpClientModule
  ],
  declarations: [
    AppComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
