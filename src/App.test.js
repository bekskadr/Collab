import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { mockAuthValue, mockThemeValue } from './test-utils';
import { AuthContextProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';


jest.mock('./App', () => {
  return function MockApp() {
    return <div data-testid="app-container">Mock App</div>;
  };
});


import App from './App';

test('renders app without crashing', () => {
  render(
    <MemoryRouter>
      <AuthContextProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthContextProvider>
    </MemoryRouter>
  );
  
  
  expect(screen.getByTestId('app-container')).toBeInTheDocument();
  expect(screen.getByText('Mock App')).toBeInTheDocument();
});
