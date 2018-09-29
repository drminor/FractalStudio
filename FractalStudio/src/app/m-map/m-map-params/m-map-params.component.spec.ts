import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MMapParamsComponent } from './m-map-params.component';

describe('MMapParamsComponent', () => {
  let component: MMapParamsComponent;
  let fixture: ComponentFixture<MMapParamsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MMapParamsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MMapParamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
