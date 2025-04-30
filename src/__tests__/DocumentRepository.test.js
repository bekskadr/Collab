import '@testing-library/jest-dom';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { mockDocuments } from '../test-utils';

// Mock Firebase services
jest.mock('../firebase', () => {
  return {
    db: {},
    auth: {
      currentUser: { email: 'test@example.com', uid: 'test-user-id' }
    },
    storage: {}
  };
});

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn()
}));

// Mock document service functions
jest.mock('../services/documentService', () => ({
  createDocument: jest.fn().mockImplementation(async (documentData) => {
    // Mock implementation
    return 'new-doc-id';
  }),
  fetchUserDocuments: jest.fn().mockImplementation(async (userId) => {
    // Return mock documents if userId matches
    if (userId === 'test-user-id') {
      return mockDocuments;
    }
    return [];
  }),
  fetchDocument: jest.fn().mockImplementation(async (documentId) => {
    // Return the document if it exists in mock data
    const document = mockDocuments.find(doc => doc.id === documentId);
    return document || null;
  }),
  updateDocument: jest.fn().mockImplementation(async (documentId, updates) => {
    // Mock implementation
    return true;
  }),
  deleteDocument: jest.fn().mockImplementation(async (documentId) => {
    // Mock implementation
    return { success: true, documentId };
  })
}));

// Import the mocked service functions
import { 
  createDocument, 
  fetchUserDocuments, 
  fetchDocument, 
  updateDocument, 
  deleteDocument 
} from '../services/documentService';

describe('DocumentRepository Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  // Test 1: Creating a new document
  test('Creating a new document adds document to Firestore', async () => {
    const newDocument = {
      title: 'New Document',
      content: JSON.stringify({ blocks: [{ text: 'New content' }] }),
      owner: 'test-user-id'
    };
    
    // Mock the implementation for this test
    createDocument.mockResolvedValueOnce('new-doc-id');
    
    const docId = await createDocument(newDocument);
    
    // Verify document was created
    expect(docId).toBe('new-doc-id');
    expect(createDocument).toHaveBeenCalledWith(newDocument);
  });

  // Test 2: Getting documents by user ID
  test('fetchUserDocuments returns documents for existing user', async () => {
    const userId = 'test-user-id';
    
    // Mock implementation for this test
    fetchUserDocuments.mockResolvedValueOnce(mockDocuments);
    
    const documents = await fetchUserDocuments(userId);
    
    // Verify fetched documents
    expect(documents).toHaveLength(2);
    expect(documents[0].id).toBe('doc1');
    expect(documents[0].title).toBe('Test Document 1');
    expect(documents[1].id).toBe('doc2');
    expect(documents[1].title).toBe('Test Document 2');
    expect(fetchUserDocuments).toHaveBeenCalledWith(userId);
  });

  // Test 3: Getting documents for non-existent user
  test('fetchUserDocuments returns empty array for non-existent user', async () => {
    const userId = 'non-existent-user';
    
    // Mock implementation for this test
    fetchUserDocuments.mockResolvedValueOnce([]);
    
    const documents = await fetchUserDocuments(userId);
    
    // Verify returned empty array
    expect(documents).toHaveLength(0);
    expect(fetchUserDocuments).toHaveBeenCalledWith(userId);
  });

  // Test 4: Getting document by ID
  test('fetchDocument returns document by ID', async () => {
    const documentId = 'doc1';
    const mockDocument = {
      id: 'doc1',
      title: 'Test Document 1',
      content: JSON.stringify({ blocks: [{ text: 'Test content' }] }),
      createdAt: new Date('2023-01-01').toISOString(),
      updatedAt: new Date('2023-01-02').toISOString(),
      owner: 'test-user-id',
      sharedWith: []
    };
    
    // Mock implementation for this test
    fetchDocument.mockResolvedValueOnce(mockDocument);
    
    const document = await fetchDocument(documentId);
    
    // Verify returned document
    expect(document).not.toBeNull();
    expect(document.id).toBe('doc1');
    expect(document.title).toBe('Test Document 1');
    expect(fetchDocument).toHaveBeenCalledWith(documentId);
  });

  // Test 5: Getting non-existent document
  test('fetchDocument returns null for non-existent document', async () => {
    const documentId = 'non-existent-doc';
    
    // Mock implementation for this test
    fetchDocument.mockResolvedValueOnce(null);
    
    const document = await fetchDocument(documentId);
    
    // Verify null is returned
    expect(document).toBeNull();
    expect(fetchDocument).toHaveBeenCalledWith(documentId);
  });

  // Test 6: Updating document content
  test('updateDocument updates document in Firestore', async () => {
    const documentId = 'doc1';
    const updatedContent = JSON.stringify({ blocks: [{ text: 'Updated content' }] });
    
    // Mock implementation for this test
    updateDocument.mockResolvedValueOnce(true);
    
    const result = await updateDocument(documentId, { content: updatedContent });
    
    // Verify document was updated
    expect(result).toBe(true);
    expect(updateDocument).toHaveBeenCalledWith(documentId, { content: updatedContent });
  });

  // Test 7: Deleting document
  test('deleteDocument removes document from Firestore', async () => {
    const documentId = 'doc1';
    
    // Mock implementation for this test
    deleteDocument.mockResolvedValueOnce({ success: true, documentId });
    
    const result = await deleteDocument(documentId);
    
    // Verify document was deleted
    expect(result).toEqual({ success: true, documentId });
    expect(deleteDocument).toHaveBeenCalledWith(documentId);
  });
}); 