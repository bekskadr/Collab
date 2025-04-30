import React from 'react';
import { RichUtils } from 'draft-js';
import styled from 'styled-components';

const ToolbarContainer = styled.div`
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  background: var(--bg-tertiary);
  display: flex;
  flex-wrap: wrap;
`;

const Button = styled.button`
  margin-right: 5px;
  margin-bottom: 5px;
  padding: 5px 10px;
  background: ${props => props.active ? 'var(--accent-secondary)' : 'var(--bg-secondary)'};
  border: 1px solid var(--border-primary);
  border-radius: 3px;
  cursor: pointer;
  color: var(--color-primary);
  
  &:hover {
    background: var(--bg-interactive);
  }
`;

function Toolbar({ editorState, setEditorState }) {
  const handleInlineStyle = (style) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };
  
  const handleBlockStyle = (blockType) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };
  
  // Check if style is active
  const isInlineStyleActive = (style) => {
    const currentStyle = editorState.getCurrentInlineStyle();
    return currentStyle.has(style);
  };
  
  const isBlockStyleActive = (blockType) => {
    const selection = editorState.getSelection();
    const blockType1 = editorState
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey())
      .getType();
    return blockType1 === blockType;
  };
  
  return (
    <ToolbarContainer>
      <Button 
        active={isInlineStyleActive('BOLD')}
        onClick={() => handleInlineStyle('BOLD')}
      >
        Bold
      </Button>
      <Button 
        active={isInlineStyleActive('ITALIC')}
        onClick={() => handleInlineStyle('ITALIC')}
      >
        Italic
      </Button>
      <Button 
        active={isInlineStyleActive('UNDERLINE')}
        onClick={() => handleInlineStyle('UNDERLINE')}
      >
        Underline
      </Button>
      <Button 
        active={isBlockStyleActive('header-one')}
        onClick={() => handleBlockStyle('header-one')}
      >
        H1
      </Button>
      <Button 
        active={isBlockStyleActive('header-two')}
        onClick={() => handleBlockStyle('header-two')}
      >
        H2
      </Button>
      <Button 
        active={isBlockStyleActive('unordered-list-item')}
        onClick={() => handleBlockStyle('unordered-list-item')}
      >
        Bullet List
      </Button>
      <Button 
        active={isBlockStyleActive('ordered-list-item')}
        onClick={() => handleBlockStyle('ordered-list-item')}
      >
        Numbered List
      </Button>
    </ToolbarContainer>
  );
}

export default Toolbar;