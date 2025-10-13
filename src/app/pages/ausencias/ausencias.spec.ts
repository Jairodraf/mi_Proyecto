import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ausencias } from './ausencias';

describe('Ausencias', () => {
  let component: Ausencias;
  let fixture: ComponentFixture<Ausencias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ausencias]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ausencias);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
