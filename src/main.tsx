import './utils/fetchInterceptor.ts';

// Force all numbers and dates to use 'en-US' formatting to guarantee English digits (Western Arabic numerals 1, 2, 3...)
const originalNumberToLocaleString = Number.prototype.toLocaleString;
Number.prototype.toLocaleString = function (this: number, locales?: any, options?: any): string {
  return originalNumberToLocaleString.call(this, 'en-US', options);
};

const originalDateToLocaleString = Date.prototype.toLocaleString;
Date.prototype.toLocaleString = function (this: Date, locales?: any, options?: any): string {
  return originalDateToLocaleString.call(this, 'en-US', options);
};

const originalDateToLocaleDateString = Date.prototype.toLocaleDateString;
Date.prototype.toLocaleDateString = function (this: Date, locales?: any, options?: any): string {
  return originalDateToLocaleDateString.call(this, 'en-US', options);
};

const originalDateToLocaleTimeString = Date.prototype.toLocaleTimeString;
Date.prototype.toLocaleTimeString = function (this: Date, locales?: any, options?: any): string {
  return originalDateToLocaleTimeString.call(this, 'en-US', options);
};

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
