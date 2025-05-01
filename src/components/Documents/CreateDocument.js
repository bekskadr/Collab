import React, { useState } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { createDocument } from '../../services/documentService';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const CreateButton = styled.button`
  padding: 10px 15px;
  background-color: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: var(--accent-primary-hover);
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: var(--bg-secondary);
  color: var(--color-primary);
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: var(--shadow-medium);
`;

const Title = styled.h2`
  color: var(--color-primary);
  margin-bottom: 15px;
`;

const InputLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  color: var(--color-primary);
`;

const InputField = styled.input`
  width: 100%;
  padding: 8px;
  margin-top: 5px;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  background-color: var(--bg-interactive);
  color: var(--color-primary);
  
  &:focus {
    outline: none;
    border-color: var(--accent-primary);
  }
`;

const ButtonGroup = styled.div`
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  margin-right: 10px;
  padding: 8px 15px;
  background-color: var(--bg-tertiary);
  color: var(--color-primary);
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: var(--bg-interactive);
  }
`;

const SubmitButton = styled.button`
  padding: 8px 15px;
  background-color: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background-color: var(--accent-primary-hover);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: var(--accent-danger);
  margin-bottom: 10px;
`;

function CreateDocument({ onDocumentCreated }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setLoading(true);
    try {
      const documentData = {
        title: title.trim(),
        content: ''
      };
      const newDoc = await createDocument(documentData);
      
      if (onDocumentCreated) {
        onDocumentCreated(newDoc);
      }
      
      setTitle('');
      setIsModalOpen(false);
      
      // Navigate to the editor for the new document
      navigate(`/documents/${newDoc.id}`);
    } catch (err) {
      setError('Failed to create document: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <CreateButton onClick={() => setIsModalOpen(true)}>
        Create New Document
      </CreateButton>
      
      {isModalOpen && (
        <Modal onClick={() => setIsModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <Title>Create New Document</Title>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <form onSubmit={handleSubmit}>
              <div>
                <InputLabel htmlFor="title">Document Title</InputLabel>
                <InputField
                  id="title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              <ButtonGroup>
                <CancelButton
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </CancelButton>
                <SubmitButton
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create'}
                </SubmitButton>
              </ButtonGroup>
            </form>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}

export default CreateDocument;