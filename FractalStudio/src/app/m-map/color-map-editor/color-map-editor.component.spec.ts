import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorMapEditorComponent } from './color-map-editor.component';

describe('ColorMapEditorComponent', () => {
  let component: ColorMapEditorComponent;
  let fixture: ComponentFixture<ColorMapEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ColorMapEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ColorMapEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
