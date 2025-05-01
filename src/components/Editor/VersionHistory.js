import React, { useState, useEffect } from 'react';
import { getVersionHistory, restoreVersion } from '../../services/versionService';
import styled from 'styled-components';

const VersionHistoryContainer = styled.div`
  margin-top: 20px;
  padding: 15px;
  background: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: var(--shadow-soft);
`;

const VersionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid var(--border-primary);
  padding-bottom: 10px;
`;

const VersionList = styled.ul`
  list-style: none;
  padding: 0;
  max-height: 300px;
  overflow-y: auto;
`;

const VersionItem = styled.li`
  padding: 12px;
  margin-bottom: 10px;
  background: var(--bg-interactive);
  border-radius: 6px;
  box-shadow: var(--shadow-soft);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid ${props => props.isCurrent ? 'var(--accent-success)' : 'var(--accent-primary)'};
  transition: all 0.2s ease;

  &:hover {
    background: var(--accent-secondary);
    transform: translateY(-2px);
  }
`;

const VersionInfo = styled.div`
  flex: 1;
`;

const VersionMeta = styled.div`
  display: flex;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--color-tertiary);
  margin-top: 4px;
`;

const VersionTitle = styled.div`
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 2px;
  color: var(--color-primary);
`;

const RestorationTag = styled.span`
  background: var(--accent-warning);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-left: 8px;
`;

const RestoreButton = styled.button`
  background: var(--accent-secondary);
  color: var(--accent-primary);
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background: var(--accent-secondary-hover);
  }
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

const EmptyState = styled.div`
  text-align: center;
  padding: 30px 20px;
  color: var(--color-secondary);
  background: var(--bg-tertiary);
  border-radius: 6px;
  margin-top: 10px;
`;

const ErrorMessage = styled.div`
  color: var(--accent-danger);
  background: ${props => props.theme === 'dark' ? 'rgba(207, 46, 46, 0.1)' : '#ffebee'};
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  border-left: 4px solid var(--accent-danger);
`;

export default function VersionHistory({ documentId, onRestore, refreshCounter = 0 }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restoringVersion, setRestoringVersion] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchVersionHistory = async () => {
      if (!documentId) return;
      
      try {
        setLoading(true);
        const history = await getVersionHistory(documentId);
        
        if (isMounted) {
          setVersions(history);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to load version history:", err);
        if (isMounted) {
          setError("Failed to load version history. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchVersionHistory();
    
    return () => {
      isMounted = false;
    };
  }, [documentId, refreshCounter]);

  const handleRestore = async (versionId) => {
    if (window.confirm("Are you sure you want to restore this version? Current changes will be saved as a new version.")) {
      try {
        setRestoringVersion(versionId);
        await restoreVersion(documentId, versionId);
        

        const history = await getVersionHistory(documentId);
        setVersions(history);
        
        if (onRestore) {
          onRestore();
        }
      } catch (err) {
        console.error("Failed to restore version:", err);
        alert("Failed to restore version. Please try again later.");
      } finally {
        setRestoringVersion(null);
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <VersionHistoryContainer>
        <h3>Version History</h3>
        <LoadingSpinner />
        <div style={{ textAlign: 'center' }}>Loading versions...</div>
      </VersionHistoryContainer>
    );
  }

  if (error) {
    return (
      <VersionHistoryContainer>
        <h3>Version History</h3>
        <ErrorMessage>{error}</ErrorMessage>
      </VersionHistoryContainer>
    );
  }

  return (
    <VersionHistoryContainer>
      <VersionHeader>
        <h3>Version History</h3>
        <span>{versions.length} versions</span>
      </VersionHeader>
      
      {versions.length > 0 ? (
        <VersionList>
          {versions.map((version, index) => (
            <VersionItem 
              key={version.id}
              isCurrent={index === 0}
            >
              <VersionInfo>
                <VersionTitle>
                  {index === 0 ? 'Current Version' : `Version ${versions.length - index}`}
                  {version.isRestorationPoint && <RestorationTag>Restored</RestorationTag>}
                </VersionTitle>
                <VersionMeta>
                  <span>By: {version.updatedBy || 'Unknown user'}</span>
                  <span>•</span>
                  <span>{formatDate(version.createdAt)}</span>
                </VersionMeta>
              </VersionInfo>
              
              {index !== 0 && (
                <RestoreButton 
                  onClick={() => handleRestore(version.id)}
                  disabled={restoringVersion !== null}
                >
                  {restoringVersion === version.id ? 'Restoring...' : 'Restore'}
                </RestoreButton>
              )}
            </VersionItem>
          ))}
        </VersionList>
      ) : (
        <EmptyState>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>No version history yet</div>
          <div>Make changes to the document to create versions</div>
        </EmptyState>
      )}
    </VersionHistoryContainer>
  );
}