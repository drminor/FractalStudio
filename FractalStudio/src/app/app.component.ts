import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Logger } from './logger.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnInit {

  private viewInitialized: boolean;

  constructor(private logger: Logger) {

    this.viewInitialized = false;
  }

  ngOnInit(): void {
    console.log("We are inited.");
  }

  ngOnChanges() {
    if (!this.viewInitialized) return;
  }

  ngAfterViewInit() {
    if (!this.viewInitialized) {
      this.viewInitialized = true;
      console.log("About to draw from AfterViewInit.");
    }
  }

}
