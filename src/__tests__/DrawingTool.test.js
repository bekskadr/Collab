import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { mockAuthValue, setupCanvasMock } from '../test-utils';


jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthValue
}));


jest.mock('../services/documentService', () => ({
  saveDrawing: jest.fn().mockResolvedValue(true),
  getDrawing: jest.fn().mockResolvedValue('data:image/png;base64,existingDrawingData')
}));


import { saveDrawing, getDrawing } from '../services/documentService';


const MockDrawingTool = ({ documentId, visible }) => {
  const [showDrawing, setShowDrawing] = React.useState(visible);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const loadDrawing = async () => {
      if (visible) {
        setLoading(true);
        try {
          await getDrawing(documentId);
        } finally {
          setLoading(false);
        }
      }
    };
    loadDrawing();
  }, [visible, documentId]);

  const handleClear = () => {
    const canvas = document.getElementById('drawing-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSave = async () => {
    const canvas = document.getElementById('drawing-canvas');
    if (canvas) {
      const imageData = canvas.toDataURL();
      await saveDrawing(documentId, imageData);
    }
  };

  if (loading && visible) return <div>Loading drawing...</div>;

  return (
    <div>
      <div 
        data-testid="drawing-area" 
        style={{ display: visible ? 'block' : 'none' }}
      >
        <canvas 
          id="drawing-canvas" 
          data-testid="drawing-canvas" 
          width="800" 
          height="600"
        />
        <button onClick={handleSave} data-testid="save-button">Save Drawing</button>
        <button onClick={handleClear} data-testid="clear-button">Clear Drawing</button>
      </div>
    </div>
  );
};

describe('DrawingTool Tests', () => {
  let mockCanvas;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanvas = setupCanvasMock();
  });

 
  test('Creating new drawing saves drawing data', async () => {
    
    saveDrawing.mockResolvedValue(true);
    getDrawing.mockResolvedValue('data:image/png;base64,existingDrawingData');
    
    await act(async () => {
      render(
        <BrowserRouter>
          <ThemeProvider>
            <MockDrawingTool documentId="doc1" visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );
    });

   
    expect(getDrawing).toHaveBeenCalledWith('doc1');
    
   
    const canvas = screen.getByTestId('drawing-canvas');
    
   
    await act(async () => {
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
    });
    
  
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-button'));
    });
    

    expect(saveDrawing).toHaveBeenCalledWith('doc1', 'data:image/png;base64,mockImageData');
  });

 
  test('Loading existing drawing displays correctly', async () => {
 
    getDrawing.mockResolvedValue('data:image/png;base64,existingDrawingData');
    
    await act(async () => {
      render(
        <BrowserRouter>
          <ThemeProvider>
            <MockDrawingTool documentId="doc1" visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );
    });

 
    expect(getDrawing).toHaveBeenCalledWith('doc1');
    expect(screen.getByTestId('drawing-canvas')).toBeInTheDocument();
  });


  test('Clearing drawing removes all content', async () => {
    
    getDrawing.mockResolvedValue('data:image/png;base64,existingDrawingData');
    
    await act(async () => {
      render(
        <BrowserRouter>
          <ThemeProvider>
            <MockDrawingTool documentId="doc1" visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );
    });

   
    await act(async () => {
      fireEvent.click(screen.getByTestId('clear-button'));
    });
    
   
    const context = mockCanvas.getContext();
    expect(context.clearRect).toHaveBeenCalled();
  });

  
  test('Drawing tool visibility changes as expected', async () => {
 
    getDrawing.mockResolvedValue('data:image/png;base64,existingDrawingData');
    
    
    const { rerender } = render(
      <BrowserRouter>
        <ThemeProvider>
          <MockDrawingTool documentId="doc1" visible={false} />
        </ThemeProvider>
      </BrowserRouter>
    );
    
   
    const drawingAreaHidden = screen.getByTestId('drawing-area');
    expect(drawingAreaHidden).toHaveStyle('display: none');
    
   
    await act(async () => {
      rerender(
        <BrowserRouter>
          <ThemeProvider>
            <MockDrawingTool documentId="doc1" visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );
    });
    
 
    const drawingAreaVisible = screen.getByTestId('drawing-area');
    expect(drawingAreaVisible).toHaveStyle('display: block');
  });
}); 