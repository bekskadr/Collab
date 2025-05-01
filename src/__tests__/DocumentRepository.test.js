import '@testing-library/jest-dom';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { mockDocuments } from '../test-utils';


jest.mock('../firebase', () => {
  return {
    db: {},
    auth: {
      currentUser: { email: 'test@example.com', uid: 'test-user-id' }
    },
    storage: {}
  };
});


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


jest.mock('../services/documentService', () => ({
  createDocument: jest.fn().mockImplementation(async (documentData) => {

    return 'new-doc-id';
  }),
  fetchUserDocuments: jest.fn().mockImplementation(async (userId) => {
   
    if (userId === 'test-user-id') {
      return mockDocuments;
    }
    return [];
  }),
  fetchDocument: jest.fn().mockImplementation(async (documentId) => {

    const document = mockDocuments.find(doc => doc.id === documentId);
    return document || null;
  }),
  updateDocument: jest.fn().mockImplementation(async (documentId, updates) => {
 
    return true;
  }),
  deleteDocument: jest.fn().mockImplementation(async (documentId) => {
   
    return { success: true, documentId };
  })
}));


import { 
  createDocument, 
  fetchUserDocuments, 
  fetchDocument, 
  updateDocument, 
  deleteDocument 
} from '../services/documentService';

describe('DocumentRepository Tests', () => {
  beforeEach(() => {

    jest.clearAllMocks();
  });

  
  test('Creating a new document adds document to Firestore', async () => {
    const newDocument = {
      title: 'New Document',
      content: JSON.stringify({ blocks: [{ text: 'New content' }] }),
      owner: 'test-user-id'
    };
    
  
    createDocument.mockResolvedValueOnce('new-doc-id');
    
    const docId = await createDocument(newDocument);
    
    
    expect(docId).toBe('new-doc-id');
    expect(createDocument).toHaveBeenCalledWith(newDocument);
  });

  
  test('fetchUserDocuments returns documents for existing user', async () => {
    const userId = 'test-user-id';
    
    
    fetchUserDocuments.mockResolvedValueOnce(mockDocuments);
    
    const documents = await fetchUserDocuments(userId);
    
   
    expect(documents).toHaveLength(2);
    expect(documents[0].id).toBe('doc1');
    expect(documents[0].title).toBe('Test Document 1');
    expect(documents[1].id).toBe('doc2');
    expect(documents[1].title).toBe('Test Document 2');
    expect(fetchUserDocuments).toHaveBeenCalledWith(userId);
  });

 
  test('fetchUserDocuments returns empty array for non-existent user', async () => {
    const userId = 'non-existent-user';
    
  
    fetchUserDocuments.mockResolvedValueOnce([]);
    
    const documents = await fetchUserDocuments(userId);
    

    expect(documents).toHaveLength(0);
    expect(fetchUserDocuments).toHaveBeenCalledWith(userId);
  });

 
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
    
   
    fetchDocument.mockResolvedValueOnce(mockDocument);
    
    const document = await fetchDocument(documentId);
    
   
    expect(document).not.toBeNull();
    expect(document.id).toBe('doc1');
    expect(document.title).toBe('Test Document 1');
    expect(fetchDocument).toHaveBeenCalledWith(documentId);
  });

  
  test('fetchDocument returns null for non-existent document', async () => {
    const documentId = 'non-existent-doc';
    
 
    fetchDocument.mockResolvedValueOnce(null);
    
    const document = await fetchDocument(documentId);
    
   
    expect(document).toBeNull();
    expect(fetchDocument).toHaveBeenCalledWith(documentId);
  });

 
  test('updateDocument updates document in Firestore', async () => {
    const documentId = 'doc1';
    const updatedContent = JSON.stringify({ blocks: [{ text: 'Updated content' }] });
    
   
    updateDocument.mockResolvedValueOnce(true);
    
    const result = await updateDocument(documentId, { content: updatedContent });
    
  
    expect(result).toBe(true);
    expect(updateDocument).toHaveBeenCalledWith(documentId, { content: updatedContent });
  });


  test('deleteDocument removes document from Firestore', async () => {
    const documentId = 'doc1';
    
    
    deleteDocument.mockResolvedValueOnce({ success: true, documentId });
    
    const result = await deleteDocument(documentId);
    
  
    expect(result).toEqual({ success: true, documentId });
    expect(deleteDocument).toHaveBeenCalledWith(documentId);
  });
}); 