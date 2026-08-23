import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisualizerComponent, PaintColor } from './visualizer';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';

describe('VisualizerComponent', () => {
  let component: VisualizerComponent;
  let fixture: ComponentFixture<VisualizerComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [VisualizerComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the visualizer component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle wall selection correctly', () => {
    expect(component.selectedWalls.left).toBeFalse();
    component.selectWall('left');
    expect(component.selectedWalls.left).toBeTrue();
  });

  it('should update selected color', () => {
    const testColor: PaintColor = { name: 'Warm Terracotta', hex: '#E07A5F' };
    component.selectColor(testColor);
    expect(component.selectedColor).toEqual(testColor);
  });
});