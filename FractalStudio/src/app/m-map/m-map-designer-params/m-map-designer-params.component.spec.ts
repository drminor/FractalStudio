import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MMapDesignerParamsComponent } from './m-map-designer-params.component';

describe('MMapDesignerParamsComponent', () => {
  let component: MMapDesignerParamsComponent;
  let fixture: ComponentFixture<MMapDesignerParamsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MMapDesignerParamsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MMapDesignerParamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
