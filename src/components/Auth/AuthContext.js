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


const AuthContext = createContext(null);


export function useAuth() {
  return useContext(AuthContext);
}


export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  async function signup(email, password) {
    try {
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
 
      await setDoc(doc(db, 'users', user.uid), {
        email: email.toLowerCase(),
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
     
      const pendingQuery = query(
        collection(db, 'pendingCollaborators'),
        where('email', '==', email.toLowerCase())
      );
      
      const pendingSnapshot = await getDocs(pendingQuery);
      
  
      pendingSnapshot.forEach(async (pendingDoc) => {
        const pendingData = pendingDoc.data();
        

      });
      
      return userCredential;
    } catch (error) {
      console.error("Error in signup:", error);
      throw error;
    }
  }


  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      

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


  async function logout() {
    return signOut(auth);
  }

  async function updatePassword(newPassword) {
    if (!currentUser) throw new Error("No authenticated user");
    return firebaseUpdatePassword(currentUser, newPassword);
  }


  async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

 
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

  
  async function updateUserProfile(profileData) {
    if (!currentUser) throw new Error("No authenticated user");
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, profileData, { merge: true });
      

      await fetchUserProfile();
      return true;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
   
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
      
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