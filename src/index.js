import React from 'react';
import { createRoot } from 'react-dom/client';
import CalorieTrackerApp from './calorie-counter-app';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <CalorieTrackerApp />
  </React.StrictMode>
);