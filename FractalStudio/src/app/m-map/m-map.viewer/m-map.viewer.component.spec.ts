import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MMapViewerComponent } from './m-map.viewer.component';

describe('MMap.ViewerComponent', () => {
  let component: MMapViewerComponent;
  let fixture: ComponentFixture<MMapViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MMapViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MMapViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
