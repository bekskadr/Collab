// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { mockAuthValue, mockThemeValue } from './test-utils';

// Mock the contexts properly with mock components and hooks
jest.mock('./contexts/AuthContext', () => {
  const React = require('react');
  
  // Create a mock context
  const AuthContext = React.createContext(null);
  
  // Create a mock provider that uses the context and accepts a value
  const AuthContextProvider = ({ children }) => {
    return (
      <AuthContext.Provider value={mockAuthValue}>
        {children}
      </AuthContext.Provider>
    );
  };
  
  // Create a hook that returns the mock value
  const useAuth = () => mockAuthValue;
  
  return {
    AuthContext,
    AuthContextProvider,
    useAuth
  };
});

jest.mock('./contexts/ThemeContext', () => {
  const React = require('react');
  
  // Create a mock context
  const ThemeContext = React.createContext(null);
  
  // Create a mock provider
  const ThemeProvider = ({ children }) => {
    return (
      <ThemeContext.Provider value={mockThemeValue}>
        {children}
      </ThemeContext.Provider>
    );
  };
  
  // Create a hook that returns the mock value
  const useTheme = () => mockThemeValue;
  
  return {
    ThemeContext,
    ThemeProvider,
    useTheme
  };
});

// Mock for Firestore
jest.mock('firebase/firestore', () => {
  return {
    collection: jest.fn(),
    doc: jest.fn(),
    addDoc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getFirestore: jest.fn()
  };
});

// Mock for Firebase Auth
jest.mock('firebase/auth', () => {
  return {
    getAuth: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    sendPasswordResetEmail: jest.fn()
  };
});

// Mock for Firebase Storage
jest.mock('firebase/storage', () => {
  return {
    getStorage: jest.fn(),
    ref: jest.fn(),
    uploadString: jest.fn(),
    getDownloadURL: jest.fn()
  };
});

// Mock for Firebase App
jest.mock('firebase/app', () => {
  return {
    initializeApp: jest.fn()
  };
});

// Mock for our firebase.js file
jest.mock('./firebase', () => {
  return {
    db: {},
    auth: {
      currentUser: { email: 'test@example.com', uid: 'test-user-id' }
    },
    storage: {},
    app: {}
  };
});

// Mock document service
jest.mock('./services/documentService', () => {
  return {
    createDocument: jest.fn().mockResolvedValue('new-doc-id'),
    fetchUserDocuments: jest.fn().mockResolvedValue([
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
    ]),
    fetchDocument: jest.fn().mockImplementation((docId) => {
      if (docId === 'doc1') {
        return Promise.resolve({
          id: 'doc1',
          title: 'Test Document 1',
          content: JSON.stringify({ blocks: [{ text: 'Test content' }] }),
          createdAt: new Date('2023-01-01').toISOString(),
          updatedAt: new Date('2023-01-02').toISOString(),
          owner: 'test-user-id',
          sharedWith: []
        });
      }
      return Promise.resolve(null);
    }),
    updateDocument: jest.fn().mockResolvedValue(true),
    deleteDocument: jest.fn().mockResolvedValue({ success: true, documentId: 'doc1' }),
    saveDrawing: jest.fn().mockResolvedValue(true),
    getDrawing: jest.fn().mockResolvedValue('data:image/png;base64,mockDrawingData'),
    fetchDocumentComments: jest.fn().mockResolvedValue([
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
    ])
  };
});

// Mock for auth service
jest.mock('./services/authService', () => {
  return {
    signup: jest.fn().mockResolvedValue({ user: { email: 'test@example.com', uid: 'new-user-id' } }),
    login: jest.fn().mockResolvedValue({ user: { email: 'test@example.com', uid: 'user-123' } }),
    logout: jest.fn().mockResolvedValue(true),
    resetPassword: jest.fn().mockResolvedValue(true)
  };
});

// Mock for canvas API
if (typeof window !== 'undefined') {
  window.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    drawImage: jest.fn()
  }));
  
  window.HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mockImageData');
}
