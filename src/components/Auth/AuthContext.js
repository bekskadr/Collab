import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword as firebaseUpdatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Create the auth context
const AuthContext = createContext(null);

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Sign up function
  async function signup(email, password) {
    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store user in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: email.toLowerCase(),
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      // Check if this user was invited to any documents
      const pendingQuery = query(
        collection(db, 'pendingCollaborators'),
        where('email', '==', email.toLowerCase())
      );
      
      const pendingSnapshot = await getDocs(pendingQuery);
      
      // If there are pending invitations, update the documents with the real user ID
      pendingSnapshot.forEach(async (pendingDoc) => {
        const pendingData = pendingDoc.data();
        
        // No need to handle this now, as our security rules already allow both email and uid
        // This is just for future reference
      });
      
      return userCredential;
    } catch (error) {
      console.error("Error in signup:", error);
      throw error;
    }
  }

  // Login function
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login
      if (userCredential.user) {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          lastLogin: new Date()
        }, { merge: true });
      }
      
      return userCredential;
    } catch (error) {
      console.error("Error in login:", error);
      throw error;
    }
  }

  // Logout function
  async function logout() {
    return signOut(auth);
  }

  // Update password function
  async function updatePassword(newPassword) {
    if (!currentUser) throw new Error("No authenticated user");
    return firebaseUpdatePassword(currentUser, newPassword);
  }

  // Send password reset email
  async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Get user profile from Firestore
  async function fetchUserProfile() {
    if (!currentUser) return null;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
        return userDoc.data();
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  // Update user profile in Firestore
  async function updateUserProfile(profileData) {
    if (!currentUser) throw new Error("No authenticated user");
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, profileData, { merge: true });
      
      // Refresh profile data
      await fetchUserProfile();
      return true;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user exists in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        // If user doc doesn't exist, create it
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            email: user.email.toLowerCase(),
            createdAt: new Date(),
            lastLogin: new Date()
          });
        }
        
        const profileData = userDocSnap.exists() ? userDocSnap.data() : null;
        setUserProfile(profileData);
      } else {
        setUserProfile(null);
      }
      
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    updatePassword,
    resetPassword,
    fetchUserProfile,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };

const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const pageSize = 50; 


useEffect(() => {
  const loadDocumentPage = async () => {
    try {
      const metadata = await getDocumentMetadata(documentId);
      const pages = Math.ceil(metadata.blockCount / pageSize);
      setTotalPages(pages);

      const pageContent = await getDocumentPage(documentId, currentPage, pageSize);
  
      if (pageContent) {
        setEditorState(deserializeContent(pageContent));
      }
    } catch (error) {
      console.error("Error loading document page:", error);
    }
  };
  
  loadDocumentPage();
}, [documentId, currentPage]);