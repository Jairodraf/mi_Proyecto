import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fichaje } from './fichaje';

describe('Fichaje', () => {
  let component: Fichaje;
  let fixture: ComponentFixture<Fichaje>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fichaje]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Fichaje);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
