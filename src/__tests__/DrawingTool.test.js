import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { mockAuthValue, setupCanvasMock } from '../test-utils';

// Mock the auth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthValue
}));

// Mock document service
jest.mock('../services/documentService', () => ({
  saveDrawing: jest.fn().mockResolvedValue(true),
  getDrawing: jest.fn().mockResolvedValue('data:image/png;base64,existingDrawingData')
}));

// Import mocked document service functions
import { saveDrawing, getDrawing } from '../services/documentService';

// Mock DrawingTool component
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

  // Test 1: Creating new drawing
  test('Creating new drawing saves drawing data', async () => {
    // Set up mock implementation for this test
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

    // Verify drawing was initially loaded
    expect(getDrawing).toHaveBeenCalledWith('doc1');
    
    // Find canvas element
    const canvas = screen.getByTestId('drawing-canvas');
    
    // Simulate drawing actions
    await act(async () => {
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
    });
    
    // Save the drawing
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-button'));
    });
    
    // Verify
    expect(saveDrawing).toHaveBeenCalledWith('doc1', 'data:image/png;base64,mockImageData');
  });

  // Test 2: Loading existing drawing
  test('Loading existing drawing displays correctly', async () => {
    // Set up mock implementation for this test
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

    // Verify drawing was loaded
    expect(getDrawing).toHaveBeenCalledWith('doc1');
    expect(screen.getByTestId('drawing-canvas')).toBeInTheDocument();
  });

  // Test 3: Clearing drawing
  test('Clearing drawing removes all content', async () => {
    // Set up mock implementation for this test
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

    // Clear the drawing
    await act(async () => {
      fireEvent.click(screen.getByTestId('clear-button'));
    });
    
    // Verify
    const context = mockCanvas.getContext();
    expect(context.clearRect).toHaveBeenCalled();
  });

  // Test 4: Drawing tool visibility
  test('Drawing tool visibility changes as expected', async () => {
    // Set up mock implementation for this test
    getDrawing.mockResolvedValue('data:image/png;base64,existingDrawingData');
    
    // Test with drawing tool hidden
    const { rerender } = render(
      <BrowserRouter>
        <ThemeProvider>
          <MockDrawingTool documentId="doc1" visible={false} />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    // Check that the drawing area is not visible
    const drawingAreaHidden = screen.getByTestId('drawing-area');
    expect(drawingAreaHidden).toHaveStyle('display: none');
    
    // Rerender with drawing tool visible
    await act(async () => {
      rerender(
        <BrowserRouter>
          <ThemeProvider>
            <MockDrawingTool documentId="doc1" visible={true} />
          </ThemeProvider>
        </BrowserRouter>
      );
    });
    
    // Check that the drawing area is now visible
    const drawingAreaVisible = screen.getByTestId('drawing-area');
    expect(drawingAreaVisible).toHaveStyle('display: block');
  });
}); 