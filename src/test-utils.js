import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';

// Mock auth context values
export const mockAuthValue = {
  currentUser: { email: 'test@example.com', uid: 'test-user-id' },
  loading: false,
  logout: jest.fn().mockResolvedValue(true),
  login: jest.fn().mockResolvedValue({ user: { email: 'test@example.com', uid: 'test-user-id' } }),
  signup: jest.fn().mockResolvedValue({ user: { email: 'test@example.com', uid: 'new-user-id' } }),
  resetPassword: jest.fn().mockResolvedValue(true)
};

// Create mock context provider
export const MockAuthProvider = ({ children, mockValue = mockAuthValue }) => {
  return (
    <MockAuthContext.Provider value={mockValue}>
      {children}
    </MockAuthContext.Provider>
  );
};

// Create a mock auth context
export const MockAuthContext = React.createContext(null);

// Mock theme context values
export const mockThemeValue = {
  darkMode: false,
  toggleDarkMode: jest.fn(),
  setDarkMode: jest.fn()
};

// Create a mock theme provider
export const MockThemeProvider = ({ children, mockValue = mockThemeValue }) => {
  return (
    <MockThemeContext.Provider value={mockValue}>
      {children}
    </MockThemeContext.Provider>
  );
};

// Create a mock theme context
export const MockThemeContext = React.createContext(null);

// Mock document data
export const mockDocuments = [
  {
    id: 'doc1',
    title: 'Test Document 1',
    content: JSON.stringify({ blocks: [{ text: 'Test content 1' }] }),
    createdAt: new Date('2023-01-01').toISOString(),
    updatedAt: new Date('2023-01-02').toISOString(),
    owner: 'test-user-id',
    sharedWith: []
  },
  {
    id: 'doc2',
    title: 'Test Document 2',
    content: JSON.stringify({ blocks: [{ text: 'Test content 2' }] }),
    createdAt: new Date('2023-02-01').toISOString(),
    updatedAt: new Date('2023-02-02').toISOString(),
    owner: 'test-user-id',
    sharedWith: [{ email: 'user2@example.com', permission: 'read' }]
  }
];

// Mock comments data
export const mockComments = [
  {
    id: 'comment1',
    text: 'Test comment 1',
    author: 'user1@example.com',
    createdAt: new Date('2023-01-01').toISOString()
  },
  {
    id: 'comment2',
    text: 'Test comment 2',
    author: 'user2@example.com',
    createdAt: new Date('2023-01-02').toISOString()
  }
];

// Custom render with all providers
export function renderWithProviders(ui, options = {}) {
  const { authValue = mockAuthValue, themeValue = mockThemeValue, ...renderOptions } = options;
  
  return render(
    <BrowserRouter>
      <MockAuthProvider mockValue={authValue}>
        <MockThemeProvider mockValue={themeValue}>
          {ui}
        </MockThemeProvider>
      </MockAuthProvider>
    </BrowserRouter>,
    renderOptions
  );
}

// Mocking canvas
export const setupCanvasMock = () => {
  // Mock canvas methods
  const mockCanvas = {
    getContext: jest.fn().mockReturnValue({
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      drawImage: jest.fn()
    }),
    width: 800,
    height: 600,
    toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mockImageData')
  };

  // Apply mock to HTMLCanvasElement prototype
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    writable: true,
    value: mockCanvas.getContext
  });
  
  Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
    writable: true,
    value: mockCanvas.width
  });
  
  Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
    writable: true,
    value: mockCanvas.height
  });
  
  Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
    writable: true,
    value: mockCanvas.toDataURL
  });

  return mockCanvas;
}; 