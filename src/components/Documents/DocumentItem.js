import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { deleteDocument } from '../../services/documentService';
import styled from 'styled-components';

const DocumentCard = styled.div`
  border: 1px solid var(--border-primary);
  border-radius: 10px;
  padding: 20px;
  background-color: var(--bg-secondary);
  transition: all 0.2s ease;
  box-shadow: var(--shadow-medium);
  
  &:hover {
    box-shadow: var(--shadow-strong);
    transform: translateY(-3px);
  }
`;

const DocumentTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DocumentDate = styled.div`
  font-size: 13px;
  color: var(--color-secondary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  
  &:before {
    content: "•";
    display: inline-block;
    margin-right: 5px;
    font-size: 16px;
    color: var(--color-secondary);
  }
`;

const DocumentActions = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  padding-top: 12px;
  border-top: 1px solid var(--border-secondary);
  background-color: var(--bg-interactive);
  margin: 15px -20px -20px;
  padding: 12px 20px;
  border-radius: 0 0 10px 10px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-weight: bold;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: var(--accent-secondary);
  }
`;

const DeleteButton = styled(ActionButton)`
  color: var(--accent-danger);
  
  &:hover {
    background-color: rgba(207, 46, 46, 0.1);
  }
`;

const OpenButton = styled(Link)`
  text-decoration: none;
  color: var(--accent-primary);
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: var(--accent-secondary);
  }
`;

function DocumentItem({ document, onDelete }) {
  const { currentUser } = useAuth();
  
  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete "${document.title}"?`)) {
      try {
        await deleteDocument(document.id);
        onDelete(document.id);
      } catch (err) {
        console.error('Error deleting document:', err);
        alert('Failed to delete document: ' + err.message);
      }
    }
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Check if current user is the owner of the document
  const isOwner = document.ownerId === currentUser.uid;
  
  return (
    <DocumentCard>
      <DocumentTitle title={document.title}>
        {document.title}
      </DocumentTitle>
      
      <DocumentDate>
        Last updated: {formatDate(document.updateAt || document.createAt)}
      </DocumentDate>
      
      <DocumentActions>
        <OpenButton to={`/documents/${document.id}`}>
          Open
        </OpenButton>
        
        {isOwner && (
          <DeleteButton 
            onClick={handleDelete}
            title="Delete this document"
          >
            Delete
          </DeleteButton>
        )}
      </DocumentActions>
    </DocumentCard>
  );
}

export default DocumentItem;