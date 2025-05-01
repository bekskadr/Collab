import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { subscribeToDrawings, addPathToDrawing, updateDrawing } from '../../services/drawingService';
import { useAuth } from '../Auth/AuthContext';

const DrawingContainer = styled.div`
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  width: 95%;
  margin: 10px auto;
  border: ${props => props.isDrawingMode ? '2px dashed var(--accent-primary)' : '1px solid var(--border-primary)'};
  border-radius: 8px;
  max-height: ${props => props.isDrawingMode ? '500px' : '350px'};
  overflow: hidden;
  background-color: var(--bg-tertiary);
  box-shadow: var(--shadow-medium);
`;

const CanvasOverlay = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: ${props => props.isDrawing ? 'crosshair' : 'default'};
  z-index: ${props => props.isDrawing ? 50 : 10};
  pointer-events: ${props => props.isDrawing ? 'auto' : 'none'};
  touch-action: none;
`;


const BlockerOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 40;
  display: ${props => props.active ? 'block' : 'none'};
`;

const DrawingControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
  z-index: 60;
  position: relative;
  padding: 10px;
  border-bottom: ${props => props.isDrawingMode ? '1px solid var(--border-primary)' : 'none'};
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ColorOption = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${props => props.color};
  cursor: pointer;
  border: 2px solid ${props => props.selected ? '#333' : 'transparent'};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: transform 0.1s;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const Button = styled.button`
  padding: 6px 12px;
  background-color: ${props => props.active ? 'var(--accent-secondary)' : 'var(--bg-tertiary)'};
  color: ${props => props.active ? 'var(--accent-primary)' : 'var(--color-primary)'};
  border: 1px solid ${props => props.active ? 'var(--accent-primary)' : 'var(--border-primary)'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.active ? 'var(--accent-secondary-hover)' : 'var(--bg-interactive)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SizeSlider = styled.input`
  width: 100px;
`;

const SizeDisplay = styled.span`
  font-size: 13px;
  color: var(--color-tertiary);
  width: 30px;
  text-align: center;
`;

const DrawingModeMessage = styled.div`
  background-color: var(--accent-success-hover);
  color: var(--color-primary);
  padding: 8px 12px;
  border-radius: 4px;
  margin: 0 8px 10px 8px;
  font-size: 14px;
  text-align: center;
  border: 1px solid var(--accent-success);
  display: ${props => props.visible ? 'block' : 'none'};
`;

const DrawingBoundaryIndicator = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3px solid var(--accent-primary);
  border-radius: 4px;
  pointer-events: none;
  z-index: 45;
  display: ${props => props.visible ? 'block' : 'none'};
  box-shadow: inset 0 0 10px rgba(33, 150, 243, 0.2);
`;

const DimensionIndicator = styled.div`
  position: absolute;
  bottom: 5px;
  right: 5px;
  background-color: var(--bg-tertiary);
  color: var(--color-primary);
  padding: 3px 6px;
  border-radius: 3px;
  font-size: 12px;
  z-index: 46;
  display: ${props => props.visible ? 'block' : 'none'};
`;

const CollaboratorIndicator = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: var(--bg-tertiary);
  color: var(--color-primary);
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 46;
  display: ${props => props.count > 0 ? 'block' : 'none'};
`;


const SaveButton = styled(Button)`
  background-color: ${props => props.disabled ? 'var(--color-tertiary)' : 'var(--accent-success)'};
  color: ${props => props.disabled ? 'var(--color-secondary)' : 'white'};
  border-color: ${props => props.disabled ? 'var(--border-secondary)' : 'var(--accent-success-hover)'};
  
  &:hover:not(:disabled) {
    background-color: var(--accent-success-hover);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const COLORS = ['#000000', '#FF0000', '#0000FF', '#008000', '#FFA500', '#800080'];

const DrawingTool = ({ documentId, editorRef, onDrawingComplete, onDrawingModeChange }) => {
  const { currentUser } = useAuth();
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(3);
  const [drawings, setDrawings] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [currentDrawingId, setCurrentDrawingId] = useState(null);
  const [collaborators, setCollaborators] = useState(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const unsubscribeRef = useRef(null);

  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
 
    setTimeout(redrawCanvas, 100);
  }, []);
  
 
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !editorRef.current || !containerRef.current) return;
    
    const editorRect = editorRef.current.getBoundingClientRect();
    const context = canvas.getContext('2d');
    
  
    const containerHeight = Math.min(editorRect.height * 0.6, 450); 
    containerRef.current.style.height = `${containerHeight}px`;
    
    canvas.width = editorRect.width;
    canvas.height = containerHeight;
    
  
    setCanvasDimensions({
      width: Math.round(editorRect.width),
      height: Math.round(containerHeight)
    });
    
  
    context.clearRect(0, 0, canvas.width, canvas.height);
    
 
    drawings.forEach(drawing => {
      const paths = drawing.paths || [];
      paths.forEach(path => {
        if (!path || !path.points || path.points.length < 2) return;
        
        context.beginPath();
        context.strokeStyle = path.color;
        context.lineWidth = path.size;
        
        context.moveTo(path.points[0].x, path.points[0].y);
        
        for (let i = 1; i < path.points.length; i++) {
          context.lineTo(path.points[i].x, path.points[i].y);
        }
        
        context.stroke();
      });
    });
  };

  
  useEffect(() => {
    if (!documentId || !currentUser) return;

    unsubscribeRef.current = subscribeToDrawings(documentId, (updatedDrawings) => {
      setDrawings(updatedDrawings);
      
    
      const collaboratorSet = new Set();
      updatedDrawings.forEach(drawing => {
        if (drawing.createdBy && drawing.createdBy !== currentUser?.uid) {
          collaboratorSet.add(drawing.createdBy);
        }
      });
      setCollaborators(collaboratorSet);
      
     
      const userDrawing = updatedDrawings.find(d => d.createdBy === currentUser?.uid);
      if (userDrawing) {
        setCurrentDrawingId(userDrawing.id);
        setHasUnsavedChanges(false); 
      } else {
        
        setCurrentDrawingId(null);
      }
      
     
      setTimeout(redrawCanvas, 50);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [documentId, currentUser]);


  useEffect(() => {
    const resizeCanvas = () => {
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [editorRef, drawings]);

 
  useEffect(() => {
    if (onDrawingModeChange) {
      onDrawingModeChange(isDrawingMode);
    }
    
   
    if (isDrawingMode && canvasRef.current) {
      canvasRef.current.focus();
    }
    
    
    setTimeout(redrawCanvas, 50);
  }, [isDrawingMode, onDrawingModeChange]);

  const startDrawing = (e) => {
    if (!isDrawingMode) return;
 
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (!clientX || !clientY) return;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
    
    const context = canvas.getContext('2d');
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = size;
    context.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || !isDrawingMode) return;
    
   
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
  
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (!clientX || !clientY) return;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    setCurrentPath(prev => [...prev, { x, y }]);
    
    const context = canvas.getContext('2d');
    context.lineTo(x, y);
    context.stroke();
  };

  const endDrawing = async (e) => {
    if (!isDrawing || !isDrawingMode) return;
    

    if (e) e.preventDefault();
    
    setIsDrawing(false);
    
    if (currentPath.length > 1) {
      const newDrawing = {
        id: Date.now().toString(),
        color,
        size,
        points: [...currentPath]
      };
      
      try {

        setHasUnsavedChanges(true);
        

        if (currentDrawingId) {
          await addPathToDrawing(currentDrawingId, newDrawing);
        }

        else if (onDrawingComplete) {
          onDrawingComplete(newDrawing);
        }
      } catch (error) {
        console.error('Error saving drawing path:', error);
      }
    }
    
    setCurrentPath([]);
  };

  const handleClear = async () => {
    try {

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      

      if (currentDrawingId) {

        await updateDrawing(currentDrawingId, { paths: [] });
        

      }
    } catch (error) {
      console.error('Error clearing drawings:', error);
    }
  };

  const handleUndo = async () => {
    try {

      const userDrawing = drawings.find(d => d.id === currentDrawingId);
      if (!userDrawing || !userDrawing.paths || userDrawing.paths.length === 0) return;
      

      const newPaths = [...userDrawing.paths];
      newPaths.pop();
      
    
      if (onDrawingComplete) {
        onDrawingComplete({ undoLast: true });
      }
    } catch (error) {
      console.error('Error undoing drawing:', error);
    }
  };

  const toggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
    if (isDrawing) {
      endDrawing();
    }
  };

  const handleSave = async () => {
    if (onDrawingComplete) {
      onDrawingComplete({ saveDrawing: true });
      setHasUnsavedChanges(false);
    }
  };

  return (
    <>
      <DrawingContainer ref={containerRef} isDrawingMode={isDrawingMode}>
        <DrawingControls isDrawingMode={isDrawingMode}>
        <Button 
          active={isDrawingMode}
          onClick={toggleDrawingMode}
        >
          {isDrawingMode ? 'Exit Drawing Mode' : 'Enter Drawing Mode'}
        </Button>
        
        {isDrawingMode && (
          <>
            <ControlGroup>
              {COLORS.map(c => (
                <ColorOption 
                  key={c} 
                  color={c} 
                  selected={color === c}
                  onClick={() => setColor(c)}
                />
              ))}
            </ControlGroup>
            
            <ControlGroup>
              <span>Size:</span>
              <SizeSlider 
                type="range" 
                min="1" 
                max="20" 
                value={size}
                onChange={e => setSize(Number(e.target.value))}
              />
              <SizeDisplay>{size}px</SizeDisplay>
            </ControlGroup>
            
            <Button onClick={handleUndo}>
              Undo Last
            </Button>
            
            <Button onClick={handleClear}>
              Clear My Drawings
            </Button>
            
            <SaveButton 
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
            >
              Save Drawings
            </SaveButton>
          </>
        )}
      </DrawingControls>
      
      <DrawingModeMessage visible={isDrawingMode}>
        {collaborators.size > 0 ? 
          `${collaborators.size} other ${collaborators.size === 1 ? 'person' : 'people'} currently drawing` 
          : 'Drawing mode active. Draw on the document.'
        }
      </DrawingModeMessage>
      
        {/* This overlay blocks interaction with the editor when in drawing mode */}
        <BlockerOverlay active={isDrawingMode} />
        
        {/* Visual indicator for drawing boundaries */}
        <DrawingBoundaryIndicator visible={isDrawingMode} />
        
        {/* Dimensions indicator */}
        <DimensionIndicator visible={isDrawingMode}>
          {canvasDimensions.width} × {canvasDimensions.height} px
        </DimensionIndicator>
        
        {/* Collaborator indicator */}
        <CollaboratorIndicator count={collaborators.size}>
          {collaborators.size} {collaborators.size === 1 ? 'person' : 'people'} drawing
        </CollaboratorIndicator>
        
        <CanvasOverlay
          ref={canvasRef}
          isDrawing={isDrawingMode}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          onTouchCancel={endDrawing}
        />
      </DrawingContainer>
    </>
  );
};

export default DrawingTool; 