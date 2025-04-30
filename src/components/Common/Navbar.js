import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import UserMenu from './UserMenu';
import './Navbar.css';

function Navbar() {
  const { currentUser, loading, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Show a simplified navbar while loading
  if (loading) {
    return (
      <nav className="navbar">
        <Link to="/" className="logo">Collaborative Editor</Link>
      </nav>
    );
  }
  
  // If no user is authenticated, show login/register links
  if (!currentUser) {
    return (
      <nav className="navbar">
        <Link to="/" className="logo">Collaborative Editor</Link>
        <div className="nav-links">
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/register" className="nav-link">Register</Link>
        </div>
      </nav>
    );
  }
  
  // If user is authenticated, show user-specific content
  return (
    <nav className="navbar">
      <Link to="/" className="logo">Collaborative Editor</Link>
      <div className="nav-links">
        <Link to="/documents" className="nav-link">My Documents</Link>
        <UserMenu />
      </div>
    </nav>
  );
}

export default Navbar;