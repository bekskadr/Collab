import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getDocumentComments, getAllDocumentComments } from '../../services/commentService';
import CommentItem from './CommentItem';
import NewComment from './NewComment';

const CommentsContainer = styled.div`
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
  box-shadow: var(--shadow-soft);
`;

const CommentsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-primary);
`;

const CommentsTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  color: var(--color-primary);
`;

const CommentFilters = styled.div`
  display: flex;
  gap: 12px;
  font-size: 14px;
`;

const FilterButton = styled.button`
  background: ${props => props.active ? 'var(--accent-secondary)' : 'transparent'};
  border: 1px solid ${props => props.active ? 'var(--accent-primary)' : 'var(--border-primary)'};
  color: ${props => props.active ? 'var(--accent-primary)' : 'var(--color-secondary)'};
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  
  &:hover {
    background: ${props => props.active ? 'var(--accent-secondary-hover)' : 'var(--bg-interactive)'};
    border-color: ${props => props.active ? 'var(--accent-primary)' : 'var(--border-tertiary)'};
  }
`;

const CommentsEmptyState = styled.div`
  text-align: center;
  padding: 30px 20px;
  color: var(--color-secondary);
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-size: 15px;
`;

const CommentCount = styled.span`
  font-size: 14px;
  color: var(--color-secondary);
  margin-left: 8px;
`;

const LoadingSpinner = styled.div`
  border: 3px solid var(--bg-tertiary);
  border-top: 3px solid var(--accent-primary);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  color: var(--accent-danger);
  background: ${props => props.theme === 'dark' ? 'rgba(207, 46, 46, 0.1)' : '#ffebee'};
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  border-left: 4px solid var(--accent-danger);
`;

const CommentList = ({ documentId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResolved, setShowResolved] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        
        // Choose which fetch method based on filter
        const fetchedComments = showResolved 
          ? await getAllDocumentComments(documentId)
          : await getDocumentComments(documentId);
          
        setComments(fetchedComments);
        setError(null);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchComments();
    }
  }, [documentId, showResolved, refreshTrigger]);

  const handleCommentAdded = () => {
    // Trigger a refresh of the comments
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCommentUpdated = () => {
    // Trigger a refresh of the comments
    setRefreshTrigger(prev => prev + 1);
  };
  
  const activeCount = comments.filter(comment => !comment.resolved).length;
  const resolvedCount = comments.filter(comment => comment.resolved).length;
  
  return (
    <CommentsContainer>
      <CommentsHeader>
        <div>
          <CommentsTitle>
            Comments
            <CommentCount>
              {showResolved 
                ? `(${activeCount} active, ${resolvedCount} resolved)` 
                : `(${activeCount})`
              }
            </CommentCount>
          </CommentsTitle>
        </div>
        <CommentFilters>
          <FilterButton 
            active={!showResolved} 
            onClick={() => setShowResolved(false)}
          >
            Active
          </FilterButton>
          <FilterButton 
            active={showResolved} 
            onClick={() => setShowResolved(true)}
          >
            All Comments
          </FilterButton>
        </CommentFilters>
      </CommentsHeader>
      
      <NewComment 
        documentId={documentId} 
        onCommentAdded={handleCommentAdded} 
      />
      
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : comments.length > 0 ? (
        comments.map(comment => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            onCommentUpdated={handleCommentUpdated} 
          />
        ))
      ) : (
        <CommentsEmptyState>
          No comments yet. Start the conversation by adding a comment above.
        </CommentsEmptyState>
      )}
    </CommentsContainer>
  );
};

export default CommentList; 