import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MMapDisplayComponent } from './m-map.display.component';

describe('MMapDisplayComponent', () => {
  let component: MMapDisplayComponent;
  let fixture: ComponentFixture<MMapDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MMapDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MMapDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
