import React, { useState } from 'react';
import { shareDocumentByEmail } from '../../services/documentService';
import styled from 'styled-components';

const DialogContainer = styled.div`
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

const DialogContent = styled.div`
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

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const InputLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  color: var(--color-primary);
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  background-color: var(--bg-interactive);
  color: var(--color-primary);
  
  &:focus {
    outline: none;
    border-color: var(--accent-primary);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 8px 15px;
  background-color: ${props => props.primary ? 'var(--accent-primary)' : 'var(--bg-tertiary)'};
  color: ${props => props.primary ? 'white' : 'var(--color-primary)'};
  border: ${props => props.primary ? 'none' : '1px solid var(--border-primary)'};
  border-radius: 4px;
  cursor: pointer;
  margin-left: ${props => props.marginLeft ? '10px' : '0'};
  
  &:hover {
    background-color: ${props => props.primary ? 'var(--accent-primary-hover)' : 'var(--bg-interactive)'};
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

const SuccessMessage = styled.div`
  color: var(--accent-success);
  margin-bottom: 10px;
`;

function ShareDialog({ documentId, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    try {
      // Use the new function that properly handles email sharing
      await shareDocumentByEmail(documentId, email);
      
      setSuccess(`Document shared with ${email}`);
      setEmail('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to share document: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <DialogContainer onClick={onClose}>
      <DialogContent onClick={e => e.stopPropagation()}>
        <Title>Share Document</Title>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        
        <form onSubmit={handleShare}>
          <FormGroup>
            <InputLabel>User Email</InputLabel>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
          </FormGroup>
          
          <ButtonContainer>
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" primary marginLeft disabled={loading}>
              {loading ? 'Sharing...' : 'Share'}
            </Button>
          </ButtonContainer>
        </form>
      </DialogContent>
    </DialogContainer>
  );
}

export default ShareDialog;