import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MMapDesignerComponent } from './m-map.designer.component';

describe('MMap.DesignerComponent', () => {
  let component: MMapDesignerComponent;
  let fixture: ComponentFixture<MMapDesignerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MMapDesignerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MMapDesignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
