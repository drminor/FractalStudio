import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FracTestClientComponent } from './frac-test-client.component';

describe('FracTestClientComponent', () => {
  let component: FracTestClientComponent;
  let fixture: ComponentFixture<FracTestClientComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FracTestClientComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FracTestClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
