// src/components/Editor/DocumentEditor.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EditorState, convertToRaw, convertFromRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './Editor.css'; // Import custom editor styling
import { useParams } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { getDocument, updateDocumentContent } from '../../services/documentService';
import { saveDrawing, getDocumentDrawings, updateDrawing } from '../../services/drawingService';
import UserPresence from './UserPresence';
import Toolbar from './Toolbar';
import ShareDialog from './ShareDialog';
import VersionHistory from './VersionHistory';
import CommentList from '../Comments/CommentList';
import DrawingTool from './DrawingTool';
import Loading from '../Common/Loading';
import styled from 'styled-components';

const DocumentContainer = styled.div`
  max-width: 900px;
  margin: 30px auto;
  padding: 30px;
  background-color: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: var(--shadow-strong);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-primary);
`;

const Title = styled.h2`
  margin: 0;
  font-weight: 600;
  color: var(--color-primary);
  font-size: 24px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  background-color: ${props => props.primary ? 'var(--accent-primary)' : 'var(--bg-tertiary)'};
  color: ${props => props.primary ? 'white' : 'var(--color-primary)'};
  border: 1px solid ${props => props.primary ? 'var(--accent-primary)' : 'var(--border-primary)'};
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.primary ? 'var(--accent-primary-hover)' : 'var(--accent-secondary)'};
    box-shadow: var(--shadow-soft);
  }
`;

const ToggleButton = styled.button`
  background-color: ${props => props.active ? 'var(--accent-secondary)' : 'var(--bg-tertiary)'};
  color: ${props => props.active ? 'var(--accent-primary)' : 'var(--color-primary)'};
  border: 1px solid ${props => props.active ? 'var(--accent-primary)' : 'var(--border-primary)'};
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-top: 16px;
  margin-right: 10px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? 'var(--accent-secondary-hover)' : 'var(--accent-secondary)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-color: var(--border-primary);
  }
`;

const EditorWrapper = styled.div`
  position: relative;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  min-height: 300px;
  padding: 20px;
  margin-bottom: 20px;
  background-color: var(--bg-secondary);
  box-shadow: var(--shadow-soft);
  
  .public-DraftEditor-content {
    min-height: 200px;
    color: var(--color-primary);
  }
  
  /* Make editor unselectable when in drawing mode */
  ${props => props.drawingMode && `
    .public-DraftEditor-content, .public-DraftEditorPlaceholder-root {
      user-select: none;
      pointer-events: none;
      opacity: 0.9;
    }
  `}
  
  /* Allow space for drawings when showing drawing tool */
  ${props => props.showDrawing && `
    padding-bottom: ${props.drawingMode ? '520px' : '370px'}; /* Adjust space based on drawing mode */
  `}
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-secondary);
  background-color: var(--bg-interactive);
  margin: 20px -30px -30px;
  padding: 16px 30px;
  border-radius: 0 0 12px 12px;
`;

const SaveButton = styled(Button)`
  background-color: ${props => props.disabled ? 'var(--color-tertiary)' : 'var(--accent-success)'};
  color: white;
  border-color: ${props => props.disabled ? 'var(--color-tertiary)' : 'var(--accent-success-hover)'};
  
  &:hover:not(:disabled) {
    background-color: var(--accent-success-hover);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const SaveIndicator = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 18px;
  background-color: ${props => props.status === 'saving' ? 'var(--accent-warning)' : 'var(--accent-success)'};
  color: white;
  border-radius: 6px;
  transition: all 0.3s ease;
  opacity: ${props => props.visible ? '1' : '0'};
  pointer-events: none;
  z-index: 1000;
  box-shadow: var(--shadow-medium);
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
`;

const SpinnerIcon = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export default function DocumentEditor() {
  const { documentId } = useParams();
  const { currentUser } = useAuth();
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [versionRefreshCounter, setVersionRefreshCounter] = useState(0);
  const [drawings, setDrawings] = useState([]);
  const [currentDrawingId, setCurrentDrawingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  
  const debounceTimeout = useRef(null);
  const lastSaveTime = useRef(null);
  const editorRef = useRef(null);
  const hideSaveIndicatorTimeout = useRef(null);

  const fetchDocument = useCallback(async () => {
    try {
      const doc = await getDocument(documentId);
      
      if (!doc) {
        console.error("Document not found");
        setLoading(false);
        setDocument({ title: 'Document not found', content: '' });
        return;
      }
      
      setDocument(doc);
      if (doc.content) {
        // Handle both string and object formats for backward compatibility
        let contentState;
        if (typeof doc.content === 'string') {
          try {
            contentState = convertFromRaw(JSON.parse(doc.content));
          } catch (e) {
            console.error("Error parsing content as JSON:", e);
            contentState = EditorState.createEmpty().getCurrentContent();
          }
        } else {
          // If content is already an object
          contentState = convertFromRaw(doc.content);
        }
        setEditorState(EditorState.createWithContent(contentState));
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading document:", error);
      setDocument({ title: 'Error loading document', content: '' });
      setLoading(false);
    }
  }, [documentId]);

  // Fetch drawings for this document
  const fetchDrawings = useCallback(async () => {
    try {
      const fetchedDrawings = await getDocumentDrawings(documentId);
      setDrawings(fetchedDrawings);
      
      // If there are drawings, set the current drawing to the most recent one by this user
      if (fetchedDrawings.length > 0 && currentUser) {
        const userDrawing = fetchedDrawings.find(d => d.createdBy === currentUser.uid);
        if (userDrawing) {
          setCurrentDrawingId(userDrawing.id);
        } else {
          // If user doesn't have their own drawing yet, clear the current drawing ID
          setCurrentDrawingId(null);
        }
      }
    } catch (error) {
      console.error("Error fetching drawings:", error);
    }
  }, [documentId, currentUser]);

  useEffect(() => {
    fetchDocument();
    fetchDrawings();
  }, [fetchDocument, fetchDrawings]);

  const handleEditorChange = (newEditorState) => {
    // Don't update the editor state if in drawing mode
    if (isDrawingMode) return;
    
    setEditorState(newEditorState);
    
    // Set unsaved changes flag
    setHasUnsavedChanges(true);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Auto-save feature still exists but now manual saving is also available
    debounceTimeout.current = setTimeout(async () => {
      const contentState = newEditorState.getCurrentContent();
      const rawContent = convertToRaw(contentState);
      
      // Don't save if there are no changes
      const currentContent = editorState.getCurrentContent();
      if (currentContent === contentState) {
        return;
      }
      
      // Only auto-save if that feature is enabled
      if (true) { // You could add a user preference here later
        await saveContent(rawContent);
      }
    }, 30000); // Now autosaves after 30 seconds of inactivity
  };

  // New function to handle manual saves
  const saveContent = async (contentToSave = null) => {
    try {
      setSaveStatus('saving');
      setShowSaveIndicator(true);
      
      if (hideSaveIndicatorTimeout.current) {
        clearTimeout(hideSaveIndicatorTimeout.current);
      }
      
      // Use provided content or get current content
      const content = contentToSave || convertToRaw(editorState.getCurrentContent());
      
      // Save the content
      await updateDocumentContent(documentId, content);
      
      // Update last save time
      lastSaveTime.current = new Date();
      
      // Update states
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      
      // Trigger version history refresh if showing
      if (showVersionHistory) {
        setVersionRefreshCounter(prev => prev + 1);
      }
      
      // Hide save indicator after 3 seconds
      hideSaveIndicatorTimeout.current = setTimeout(() => {
        setShowSaveIndicator(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving document:", error);
      setSaveStatus('unsaved');
      
      // Hide save indicator after 3 seconds
      hideSaveIndicatorTimeout.current = setTimeout(() => {
        setShowSaveIndicator(false);
      }, 3000);
    }
  };

  const handleVersionRestore = useCallback(() => {
    fetchDocument();
    setVersionRefreshCounter(prev => prev + 1);
  }, [fetchDocument]);

  const handleDrawingComplete = async (drawing) => {
    try {
      setSaveStatus('saving');
      setShowSaveIndicator(true);
      
      if (hideSaveIndicatorTimeout.current) {
        clearTimeout(hideSaveIndicatorTimeout.current);
      }
      
      // Handle special drawing commands
      if (drawing.clearAll) {
        if (currentDrawingId) {
          await updateDrawing(currentDrawingId, { paths: [] });
          await fetchDrawings();
        }
        setSaveStatus('saved');
        
        // Hide save indicator after 3 seconds
        hideSaveIndicatorTimeout.current = setTimeout(() => {
          setShowSaveIndicator(false);
        }, 3000);
        return;
      }
      
      if (drawing.undoLast) {
        const userDrawing = drawings.find(d => d.id === currentDrawingId);
        if (userDrawing && userDrawing.paths && userDrawing.paths.length > 0) {
          const newPaths = [...userDrawing.paths];
          newPaths.pop();
          await updateDrawing(currentDrawingId, { paths: newPaths });
          await fetchDrawings();
        }
        setSaveStatus('saved');
        
        // Hide save indicator after 3 seconds
        hideSaveIndicatorTimeout.current = setTimeout(() => {
          setShowSaveIndicator(false);
        }, 3000);
        return;
      }
      
      if (drawing.saveDrawing) {
        // Special case for manual save
        if (currentDrawingId && drawings.length > 0) {
          const userDrawing = drawings.find(d => d.id === currentDrawingId);
          if (userDrawing) {
            await updateDrawing(currentDrawingId, { 
              paths: userDrawing.paths || [] 
            });
            await fetchDrawings();
          }
        }
        setSaveStatus('saved');
        
        // Hide save indicator after 3 seconds
        hideSaveIndicatorTimeout.current = setTimeout(() => {
          setShowSaveIndicator(false);
        }, 3000);
        return;
      }
      
      // Normal path drawing handling
      if (!currentDrawingId) {
        // Create a new drawing record if this is the first path
        const drawingId = await saveDrawing(documentId, {
          paths: [drawing]
        });
        setCurrentDrawingId(drawingId);
        await fetchDrawings();
      } else {
        // Update the existing drawing with the new path
        const existingDrawing = drawings.find(d => d.id === currentDrawingId);
        if (existingDrawing) {
          const updatedPaths = [...(existingDrawing.paths || []), drawing];
          await updateDrawing(currentDrawingId, {
            paths: updatedPaths
          });
          await fetchDrawings();
        } else {
          // If somehow the drawing ID is invalid, create a new one
          const drawingId = await saveDrawing(documentId, {
            paths: [drawing]
          });
          setCurrentDrawingId(drawingId);
          await fetchDrawings();
        }
      }
      
      setSaveStatus('saved');
      
      // Hide save indicator after 3 seconds
      hideSaveIndicatorTimeout.current = setTimeout(() => {
        setShowSaveIndicator(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving drawing:", error);
      setSaveStatus('unsaved');
      
      // Hide save indicator after 3 seconds
      hideSaveIndicatorTimeout.current = setTimeout(() => {
        setShowSaveIndicator(false);
      }, 3000);
    }
  };

  // Handler for when drawing mode changes
  const handleDrawingModeChange = (drawingMode) => {
    setIsDrawingMode(drawingMode);
  };

  if (loading) return <Loading message="Loading document..." fullHeight />;

  return (
    <DocumentContainer>
      <Header>
        <Title>{document?.title || 'Untitled Document'}</Title>
        <ActionButtons>
          <SaveButton 
            onClick={() => isDrawingMode 
              ? handleDrawingComplete({ saveDrawing: true }) 
              : saveContent()}
            disabled={!hasUnsavedChanges && saveStatus === 'saved' && !isDrawingMode}
          >
            Save
          </SaveButton>
          <Button onClick={() => setShowShareDialog(true)}>Share</Button>
        </ActionButtons>
      </Header>
      
      <UserPresence documentId={documentId} />
      {!isDrawingMode && (
        <Toolbar editorState={editorState} setEditorState={setEditorState} />
      )}
      
      <EditorWrapper 
        ref={editorRef} 
        drawingMode={isDrawingMode} 
        showDrawing={showDrawing}
      >
        <Editor
          editorState={editorState}
          onEditorStateChange={handleEditorChange}
          placeholder="Start typing your document..."
          toolbarHidden
          readOnly={isDrawingMode}
        />
      
      {showDrawing && (
        <DrawingTool 
          documentId={documentId}
          editorRef={editorRef} 
          onDrawingComplete={handleDrawingComplete}
          onDrawingModeChange={handleDrawingModeChange}
        />
      )}
      </EditorWrapper>
      
      <ButtonGroup>
        <ToggleButton 
          active={showVersionHistory}
          onClick={() => {
            setShowVersionHistory(!showVersionHistory);
            if (!showVersionHistory) {
              // Refresh version history when opening
              setVersionRefreshCounter(prev => prev + 1);
            }
          }}
          disabled={isDrawingMode}
        >
          {showVersionHistory ? 'Hide Version History' : 'Show Version History'}
        </ToggleButton>
        
        <ToggleButton 
          active={showComments}
          onClick={() => setShowComments(!showComments)}
          disabled={isDrawingMode}
        >
          {showComments ? 'Hide Comments' : 'Show Comments'}
        </ToggleButton>
        
        <ToggleButton 
          active={showDrawing}
          onClick={() => {
            if (showDrawing && isDrawingMode) {
              // If we're hiding drawing tool while in drawing mode, exit drawing mode
              setIsDrawingMode(false);
            }
            setShowDrawing(!showDrawing);
          }}
        >
          {showDrawing ? 'Hide Drawing Tool' : 'Show Drawing Tool'}
        </ToggleButton>
      </ButtonGroup>
      
      {showVersionHistory && !isDrawingMode && (
        <VersionHistory
          documentId={documentId}
          onRestore={handleVersionRestore}
          refreshCounter={versionRefreshCounter}
        />
      )}
      
      {showComments && !isDrawingMode && (
        <CommentList documentId={documentId} />
      )}
      
      {showShareDialog && (
        <ShareDialog documentId={documentId} onClose={() => setShowShareDialog(false)} />
      )}
      
      {/* Save indicator */}
      <SaveIndicator status={saveStatus} visible={showSaveIndicator}>
        {saveStatus === 'saving' && <SpinnerIcon />}
        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save failed!'}
      </SaveIndicator>
    </DocumentContainer>
  );
}

