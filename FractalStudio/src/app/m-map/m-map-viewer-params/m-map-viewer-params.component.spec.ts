import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MMapViewerParamsComponent } from './m-map-viewer-params.component';

describe('MMapViewerParamsComponent', () => {
  let component: MMapViewerParamsComponent;
  let fixture: ComponentFixture<MMapViewerParamsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MMapViewerParamsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MMapViewerParamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
