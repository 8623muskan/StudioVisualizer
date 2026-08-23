import { Routes } from '@angular/router';
import { Home } from './home/home';
import { VisualizerComponent } from './visualizer/visualizer';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'home',
    component: Home
  },
  {
    path: 'visualizer',
    component: VisualizerComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];