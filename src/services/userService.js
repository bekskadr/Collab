import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

/**
 * Get a user ID by email address
 * This will search for users in the users collection by email address
 */
export const getUserIdByEmail = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required');
    }
    
    const q = query(
      collection(db, 'users'),
      where('email', '==', email.toLowerCase().trim())
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error(`No user found with email: ${email}`);
    }
    
    // Return the first matching user's ID
    return querySnapshot.docs[0].id;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}; 