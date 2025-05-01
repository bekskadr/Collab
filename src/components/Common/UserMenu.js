import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import styled from 'styled-components';

const UserMenuContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const UserButton = styled.button`
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  margin-left: 20px;
  font-weight: 500;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.25);
  }
`;

const UserAvatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-weight: bold;
  font-size: 12px;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 45px;
  right: 0;
  background-color: var(--bg-secondary);
  min-width: 200px;
  box-shadow: var(--shadow-medium);
  border-radius: 8px;
  padding: 8px 0;
  z-index: 100;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const MenuItem = styled.div`
  padding: 10px 16px;
  color: var(--color-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    background-color: var(--bg-interactive);
  }
`;

const MenuDivider = styled.div`
  height: 1px;
  background-color: var(--border-primary);
  margin: 8px 0;
`;

const MenuLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;
  width: 100%;
`;

const UserMenu = () => {
  const { currentUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };
  
 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  

  const getInitial = () => {
    if (!currentUser || !currentUser.email) return '?';
    return currentUser.email.charAt(0).toUpperCase();
  };
  
  if (!currentUser) return null;
  
  return (
    <UserMenuContainer ref={menuRef}>
      <UserButton onClick={toggleMenu}>
        <UserAvatar>{getInitial()}</UserAvatar>
        {currentUser.email}
      </UserButton>
      
      <DropdownMenu isOpen={isOpen}>
        <MenuItem>
          <MenuLink to="/profile">
            My Profile
          </MenuLink>
        </MenuItem>
        <MenuItem>
          <MenuLink to="/documents">
            My Documents
          </MenuLink>
        </MenuItem>
        <MenuDivider />
        <MenuItem onClick={handleLogout}>
          Logout
        </MenuItem>
      </DropdownMenu>
    </UserMenuContainer>
  );
};

export default UserMenu; 