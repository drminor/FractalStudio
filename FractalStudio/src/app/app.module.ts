import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
//import { SampleModule } from '../fractalMapLib';

import { AppComponent } from './app.component';
import { Logger } from './logger.service';

import { MMapModule } from './mMap/m-map.module';

@NgModule({
  imports: [
    BrowserModule,
    MMapModule
  ],
  declarations: [
    AppComponent
  ],
  providers: [Logger],
  bootstrap: [AppComponent]
})
export class AppModule { }
