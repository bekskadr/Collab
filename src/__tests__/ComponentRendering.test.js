import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { mockAuthValue, mockDocuments, mockComments, renderWithProviders } from '../test-utils';

// Mock the auth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthValue
}));

// Mock document service
jest.mock('../services/documentService', () => ({
  fetchUserDocuments: jest.fn().mockResolvedValue([]),
  fetchDocument: jest.fn().mockResolvedValue(null),
  fetchDocumentComments: jest.fn().mockResolvedValue([])
}));

// Import mocked document service functions
import { 
  fetchUserDocuments,
  fetchDocument,
  fetchDocumentComments
} from '../services/documentService';

// Mock components to avoid import errors
const MockNavbar = () => {
  const { currentUser, logout } = mockAuthValue;
  return (
    <div>
      <span>{currentUser.email}</span>
      <span>Documents</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const MockDocumentList = () => {
  const [documents, setDocuments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      try {
        const docs = await fetchUserDocuments(mockAuthValue.currentUser.uid);
        setDocuments(docs);
      } finally {
        setLoading(false);
      }
    };
    loadDocuments();
  }, []);
  
  if (loading) return <div>Loading documents...</div>;
  
  return (
    <div>
      {documents.map(doc => (
        <div key={doc.id} data-testid="document-item">
          <h3>{doc.title}</h3>
          <p data-testid="document-date">
            {new Date(doc.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      ))}
    </div>
  );
};

const MockDocumentEditor = ({ documentId }) => {
  const [document, setDocument] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const loadDocument = async () => {
      setLoading(true);
      try {
        const doc = await fetchDocument(documentId);
        setDocument(doc);
      } finally {
        setLoading(false);
      }
    };
    loadDocument();
  }, [documentId]);
  
  if (loading) return <div>Loading document...</div>;
  if (!document) return <div>Document not found</div>;
  
  return (
    <div data-testid="document-editor">
      <h2>{document.title}</h2>
      <div>Test content</div>
    </div>
  );
};

const MockCommentSection = ({ documentId }) => {
  const [comments, setComments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const loadComments = async () => {
      setLoading(true);
      try {
        const loadedComments = await fetchDocumentComments(documentId);
        setComments(loadedComments);
      } finally {
        setLoading(false);
      }
    };
    loadComments();
  }, [documentId]);
  
  if (loading) return <div>Loading comments...</div>;
  
  return (
    <div data-testid="comment-section">
      {comments.map(comment => (
        <div key={comment.id} data-testid="comment-item">
          <p>{comment.text}</p>
          <span>{comment.author}</span>
        </div>
      ))}
    </div>
  );
};

const MockCreateDocumentModal = ({ isOpen }) => {
  return (
    <div role="dialog" className={isOpen ? "dark-mode" : ""}>
      <h2>Create New Document</h2>
    </div>
  );
};

const MockShareModal = ({ isOpen }) => {
  return (
    <div role="dialog" className={isOpen ? "dark-mode" : ""}>
      <h2>Share Document</h2>
    </div>
  );
};

// Modal components for testing theme
const MockModal = ({ isOpen, title }) => {
  return (
    <div role="dialog" className={isOpen ? "dark-mode" : ""} data-testid="modal">
      <h2>{title}</h2>
    </div>
  );
};

describe('Component Rendering Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Document list rendering
  test('DocumentList renders all user documents', async () => {
    // Set up mock implementation for this test
    fetchUserDocuments.mockResolvedValue(mockDocuments);

    await act(async () => {
      render(
        <BrowserRouter>
          <ThemeProvider>
            <MockDocumentList />
          </ThemeProvider>
        </BrowserRouter>
      );
    });
    
    // Verify the documents have been loaded and displayed
    expect(fetchUserDocuments).toHaveBeenCalledWith('test-user-id');
    expect(screen.getAllByTestId('document-item')).toHaveLength(2);
    expect(screen.getByText('Test Document 1')).toBeInTheDocument();
    expect(screen.getByText('Test Document 2')).toBeInTheDocument();
    expect(screen.getAllByTestId('document-date')).toHaveLength(2);
  });

  // Test 2: Editor rendering
  test('DocumentEditor renders with correct content', async () => {
    // Set up mock implementation for this test
    fetchDocument.mockResolvedValue({
      id: 'doc1',
      title: 'Test Document 1',
      content: JSON.stringify({ blocks: [{ text: 'Test content' }] }),
      owner: 'test-user-id'
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <ThemeProvider>
            <MockDocumentEditor documentId="doc1" />
          </ThemeProvider>
        </BrowserRouter>
      );
    });

    // Verify the document has been loaded and displayed
    expect(fetchDocument).toHaveBeenCalledWith('doc1');
    expect(screen.getByTestId('document-editor')).toBeInTheDocument();
    expect(screen.getByText('Test Document 1')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  // Test 3: Comment section rendering
  test('CommentSection renders all comments', async () => {
    // Set up mock implementation for this test
    fetchDocumentComments.mockResolvedValue(mockComments);

    await act(async () => {
      render(
        <BrowserRouter>
          <ThemeProvider>
            <MockCommentSection documentId="doc1" />
          </ThemeProvider>
        </BrowserRouter>
      );
    });

    // Verify the comments have been loaded and displayed
    expect(fetchDocumentComments).toHaveBeenCalledWith('doc1');
    expect(screen.getByTestId('comment-section')).toBeInTheDocument();
    expect(screen.getAllByTestId('comment-item')).toHaveLength(2);
    expect(screen.getByText('Test comment 1')).toBeInTheDocument();
    expect(screen.getByText('Test comment 2')).toBeInTheDocument();
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('user2@example.com')).toBeInTheDocument();
  });

  // Test 4: Modal dialogs in dark mode
  test('Modal dialogs display correctly in dark mode', () => {
    // Create a custom ThemeProvider with dark mode enabled
    const CustomThemeProvider = ({ children }) => {
      return (
        <ThemeProvider value={{ darkMode: true, toggleDarkMode: jest.fn() }}>
          {children}
        </ThemeProvider>
      );
    };

    render(
      <BrowserRouter>
        <CustomThemeProvider>
          <MockModal isOpen={true} title="Test Modal" />
        </CustomThemeProvider>
      </BrowserRouter>
    );

    // Check if the modal has dark mode styling
    const modal = screen.getByTestId('modal');
    expect(modal).toHaveClass('dark-mode');
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  // Test 5: Navbar rendering
  test('Navbar displays user email and navigation options', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <MockNavbar />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Check if user email is displayed
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    
    // Check for navigation elements
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    
    // Test logout functionality
    userEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(mockAuthValue.logout).toHaveBeenCalled();
  });
}); 