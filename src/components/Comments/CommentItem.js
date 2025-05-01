import React, { useState } from 'react';
import styled from 'styled-components';
import { updateComment, deleteComment, resolveComment } from '../../services/commentService';
import { useAuth } from '../Auth/AuthContext';

const CommentContainer = styled.div`
  background-color: ${props => props.resolved 
    ? 'var(--accent-success-hover)' 
    : 'var(--bg-secondary)'};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-soft);
  position: relative;
  border-left: 3px solid ${props => props.resolved 
    ? 'var(--accent-success)' 
    : 'var(--accent-primary)'};
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: var(--shadow-medium);
  }
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const CommentAuthor = styled.div`
  font-weight: 500;
  color: var(--color-primary);
  font-size: 14px;
`;

const CommentTimestamp = styled.div`
  font-size: 12px;
  color: var(--color-tertiary);
  margin-top: 2px;
`;

const CommentActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-tertiary);
  font-size: 12px;
  padding: 2px 5px;
  
  &:hover {
    color: var(--accent-primary);
  }
`;

const ResolveButton = styled(ActionButton)`
  &:hover {
    color: var(--accent-success);
  }
`;
  
const DeleteButton = styled(ActionButton)`
  &:hover {
    color: var(--accent-danger);
  }
`;

const CommentText = styled.div`
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-primary);
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 8px;
`;

const EditForm = styled.form`
  margin-top: 8px;
  margin-bottom: 8px;
`;

const EditTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 8px;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  margin-bottom: 8px;
  resize: vertical;
  background-color: var(--bg-interactive);
  color: var(--color-primary);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SaveButton = styled(Button)`
  background-color: var(--accent-primary);
  color: white;
  
  &:hover:not(:disabled) {
    background-color: var(--accent-primary-hover);
  }
`;

const CancelButton = styled(Button)`
  background-color: var(--bg-tertiary);
  color: var(--color-primary);
  
  &:hover:not(:disabled) {
    background-color: var(--border-primary);
  }
`;

const ResolvedTag = styled.div`
  display: inline-block;
  background-color: var(--accent-success);
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  vertical-align: middle;
`;

const ResolvedInfo = styled.div`
  font-size: 12px;
  color: var(--accent-success);
  margin-top: 4px;
`;

const formatDate = (timestamp) => {
  if (!timestamp) return 'Just now';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const CommentItem = ({ comment, onCommentUpdated }) => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  
  const isAuthor = currentUser && comment.createdBy === currentUser.uid;
  
  const handleEdit = () => {
    setEditText(comment.text);
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(comment.text);
  };
  
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editText.trim()) return;
    
    try {
      setIsSubmitting(true);
      await updateComment(comment.id, { text: editText.trim() });
      setIsEditing(false);
      if (onCommentUpdated) {
        onCommentUpdated();
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment(comment.id);
        if (onCommentUpdated) {
          onCommentUpdated();
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment: ' + error.message);
      }
    }
  };
  
  const handleResolve = async () => {
    try {
      await resolveComment(comment.id, !comment.resolved);
      if (onCommentUpdated) {
        onCommentUpdated();
      }
    } catch (error) {
      console.error('Error resolving comment:', error);
      alert('Failed to resolve comment: ' + error.message);
    }
  };
  
  return (
    <CommentContainer resolved={comment.resolved}>
      <CommentHeader>
        <div>
          <CommentAuthor>
            {comment.createdByEmail || 'Anonymous'}
            {comment.resolved && <ResolvedTag>Resolved</ResolvedTag>}
          </CommentAuthor>
          <CommentTimestamp>{formatDate(comment.createdAt)}</CommentTimestamp>
        </div>
        <CommentActions>
          {isAuthor && !isEditing && !comment.resolved && (
            <ActionButton onClick={handleEdit}>Edit</ActionButton>
          )}
          {isAuthor && !isEditing && (
            <ActionButton onClick={handleDelete}>Delete</ActionButton>
          )}
          <ResolveButton 
            onClick={handleResolve} 
            resolved={comment.resolved}
          >
            {comment.resolved ? 'Unresolve' : 'Resolve'}
          </ResolveButton>
        </CommentActions>
      </CommentHeader>
      
      {isEditing ? (
        <EditForm onSubmit={handleSaveEdit}>
          <EditTextarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Edit your comment..."
            required
          />
          <ButtonGroup>
            <CancelButton 
              type="button" 
              onClick={handleCancelEdit}
              disabled={isSubmitting}
            >
              Cancel
            </CancelButton>
            <SaveButton 
              type="submit" 
              disabled={!editText.trim() || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </SaveButton>
          </ButtonGroup>
        </EditForm>
      ) : (
        <CommentText>{comment.text}</CommentText>
      )}
      
      {comment.resolved && comment.resolvedByEmail && (
        <ResolvedInfo>
          Resolved by {comment.resolvedByEmail} • {formatDate(comment.resolvedAt)}
        </ResolvedInfo>
      )}
    </CommentContainer>
  );
};

export default CommentItem; 