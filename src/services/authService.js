import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';


export const signup = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
   
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: email,
      createdAt: new Date().toISOString(),
      documents: []
    });
    
    return userCredential;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};


export const logout = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};


export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}; 