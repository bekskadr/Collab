// src/components/Documents/DocumentList.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { getUserDocuments } from '../../services/documentService';
import DocumentItem from './DocumentItem';
import CreateDocument from './CreateDocument';
import styled from 'styled-components';
import Loading from '../Common/Loading';

const DocumentsContainer = styled.div`
  max-width: 1000px;
  margin: 30px auto;
  padding: 30px;
  background-color: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: var(--shadow-strong);
`;

const DocumentsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  border-bottom: 1px solid var(--border-primary);
  padding-bottom: 20px;
  
  h1 {
    font-size: 28px;
    color: var(--color-primary);
    font-weight: 600;
  }
`;

const DocumentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 40px;
  background-color: var(--bg-tertiary);
  border-radius: 10px;
  margin-top: 20px;
  border: 1px dashed var(--border-tertiary);
`;

const EmptyStateText = styled.p`
  font-size: 18px;
  color: var(--color-secondary);
  margin-bottom: 24px;
`;

function DocumentList() {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDocuments = useCallback(async () => {
    try {
      if (currentUser) {
        const docs = await getUserDocuments(currentUser.uid);
        // Sort documents by updateAt timestamp (newest first)
        docs.sort((a, b) => {
          const timeA = a.updateAt ? (a.updateAt.toMillis ? a.updateAt.toMillis() : new Date(a.updateAt).getTime()) : 0;
          const timeB = b.updateAt ? (b.updateAt.toMillis ? b.updateAt.toMillis() : new Date(b.updateAt).getTime()) : 0;
          return timeB - timeA;
        });
        setDocuments(docs);
      }
    } catch (err) {
      setError('Failed to load documents: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDocumentCreated = (newDocument) => {
    // Force documents refresh after creation
    fetchDocuments();
  };

  const handleDocumentDeleted = (documentId) => {
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
  };

  if (loading) return <Loading message="Loading documents..." fullHeight />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <DocumentsContainer>
      <DocumentsHeader>
        <h1>My Documents</h1>
        <CreateDocument onDocumentCreated={handleDocumentCreated} />
      </DocumentsHeader>

      {documents.length === 0 ? (
        <EmptyState>
          <EmptyStateText>No documents yet.</EmptyStateText>
          <CreateDocument onDocumentCreated={handleDocumentCreated} />
        </EmptyState>
      ) : (
        <DocumentsGrid>
          {documents.map(doc => (
            <DocumentItem
              key={doc.id}
              document={doc}
              onDelete={handleDocumentDeleted}
            />
          ))}
        </DocumentsGrid>
      )}
    </DocumentsContainer>
  );
}

export default DocumentList;
