import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  // Backend tests run in the Node environment where the DOM is absent.
  if (typeof window !== 'undefined') {
    cleanup();
    window.localStorage.clear();
  }
});
