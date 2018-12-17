import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

//import { MMapDesignerComponent } from './m-map/m-map.designer/m-map.designer.component';
import { AppComponent } from './app.component';
import { MMapModule } from './m-map/m-map.module';

@NgModule({
  imports: [
    BrowserModule,
    MMapModule
  ],
  declarations: [
    AppComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
