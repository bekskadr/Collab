import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/Auth/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import DocumentList from './components/Documents/DocumentList';
import DocumentEditor from './components/Editor/DocumentEditor';
import UserProfile from './components/Auth/UserProfile';
import Navbar from './components/Common/Navbar';
import Loading from './components/Common/Loading';
import ThemeToggle from './components/Common/ThemeToggle';
import './App.css';

// Protected route component
function RequireAuth({ children }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/documents" 
              element={
                <RequireAuth>
                  <DocumentList />
                </RequireAuth>
              } 
            />
            <Route 
              path="/documents/:documentId" 
              element={
                <RequireAuth>
                  <DocumentEditor />
                </RequireAuth>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <RequireAuth>
                  <UserProfile />
                </RequireAuth>
              } 
            />
            <Route path="/" element={<Navigate to="/documents" />} />
          </Routes>
        </main>
        <ThemeToggle />
      </div>
    </ThemeProvider>
  );
}

export default App;