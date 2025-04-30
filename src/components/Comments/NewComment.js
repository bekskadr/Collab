import React, { useState } from 'react';
import styled from 'styled-components';
import { createComment } from '../../services/commentService';
import { useAuth } from '../Auth/AuthContext';

const NewCommentContainer = styled.div`
  margin-bottom: 20px;
`;

const CommentForm = styled.form`
  margin-bottom: 16px;
`;

const CommentTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  margin-bottom: 10px;
  resize: vertical;
  transition: border-color 0.2s;
  background-color: var(--bg-interactive);
  color: var(--color-primary);
  
  &:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }
  
  &::placeholder {
    color: var(--color-tertiary);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const SubmitButton = styled.button`
  background-color: var(--accent-primary);
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover:not(:disabled) {
    background-color: var(--accent-primary-hover);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  background-color: var(--bg-tertiary);
  color: var(--color-secondary);
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  margin-right: 8px;
  cursor: pointer;
  
  &:hover {
    background-color: var(--border-primary);
  }
`;

const ErrorMessage = styled.div`
  color: var(--accent-danger);
  font-size: 13px;
  margin-top: 8px;
`;

const NewComment = ({ documentId, onCommentAdded, initialText = '', onCancel }) => {
  const { currentUser } = useAuth();
  const [commentText, setCommentText] = useState(initialText);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await createComment(documentId, {
        text: commentText.trim()
      });
      
      setCommentText('');
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    setCommentText('');
    if (onCancel) {
      onCancel();
    }
  };
  
  if (!currentUser) {
    return null; // Don't render the form if user is not authenticated
  }
  
  return (
    <NewCommentContainer>
      <CommentForm onSubmit={handleSubmit}>
        <CommentTextarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment or feedback..."
          disabled={isSubmitting}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <ButtonGroup>
          {initialText && (
            <CancelButton 
              type="button" 
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </CancelButton>
          )}
          <SubmitButton 
            type="submit" 
            disabled={!commentText.trim() || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Comment'}
          </SubmitButton>
        </ButtonGroup>
      </CommentForm>
    </NewCommentContainer>
  );
};

export default NewComment; 