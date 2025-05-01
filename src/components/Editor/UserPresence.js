import React, { useEffect, useState } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { db } from '../../firebase';
import { 
  doc, 
  onSnapshot, 
  collection, 
  setDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import styled from 'styled-components';

const PresenceContainer = styled.div`
  display: flex;
  margin-bottom: 15px;
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => props.color};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-weight: bold;
`;

function UserPresence({ documentId }) {
  const { currentUser } = useAuth();
  const [activeUsers, setActiveUsers] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!documentId || !currentUser) return;
    
 
    const userPresenceRef = doc(
      db, 
      'documents', 
      documentId, 
      'presence', 
      currentUser.uid
    );
    
    
    const updatePresence = async () => {
      try {
        await setDoc(userPresenceRef, {
          displayName: currentUser.displayName || currentUser.email.split('@')[0],
          email: currentUser.email,
          lastActive: serverTimestamp(),
          color: getRandomColor(currentUser.uid)
        });
      } catch (err) {
        console.error('Error updating presence:', err);
        setError('Failed to update presence');
      }
    };
    
   
    updatePresence();
    const presenceInterval = setInterval(updatePresence, 30000);
    
  
    const presenceCollectionRef = collection(db, 'documents', documentId, 'presence');
    let unsubscribePresence;
    
    try {
      unsubscribePresence = onSnapshot(presenceCollectionRef, (snapshot) => {
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setActiveUsers(users);
      }, (err) => {
        console.error('Error in presence snapshot:', err);
        setError('Failed to get active users');
        setActiveUsers([]);
      });
    } catch (err) {
      console.error('Error setting up presence listener:', err);
      setError('Failed to set up presence listener');
    }
    

    return () => {
      clearInterval(presenceInterval);
      if (unsubscribePresence) {
        unsubscribePresence();
      }
      
 
      deleteDoc(userPresenceRef).catch(err => {
        console.error('Error removing presence:', err);
      });
    };
  }, [documentId, currentUser]);
  

  function getRandomColor(userId) {

    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }
  

  function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
  
  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }
  
  return (
    <PresenceContainer>
      {Array.isArray(activeUsers) && activeUsers.map(user => (
        <UserAvatar 
          key={user.id} 
          color={user.color || '#cccccc'} 
          title={user.displayName || user.email || 'Unknown user'}
        >
          {getInitial(user.displayName || user.email)}
        </UserAvatar>
      ))}
    </PresenceContainer>
  );
}

export default UserPresence;