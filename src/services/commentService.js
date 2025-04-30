import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  doc, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Creates a new comment for a document
 * @param {string} documentId - The ID of the document
 * @param {object} commentData - Data for the comment (text, position, etc.)
 * @returns {Promise<string>} - ID of the created comment
 */
export const createComment = async (documentId, commentData) => {
  try {
    // Get the current user
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const commentsRef = collection(db, 'comments');
    const commentDoc = await addDoc(commentsRef, {
      documentId,
      text: commentData.text,
      position: commentData.position || null, // Can be null for general comments
      selectionInfo: commentData.selectionInfo || null, // For storing selection range
      createdBy: user.uid,
      createdByEmail: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      resolved: false
    });

    return commentDoc.id;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

/**
 * Retrieves all comments for a document
 * @param {string} documentId - The ID of the document
 * @returns {Promise<Array>} - Array of comment documents
 */
export const getDocumentComments = async (documentId) => {
  try {
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('documentId', '==', documentId),
      where('resolved', '==', false),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting document comments:', error);
    throw error;
  }
};

/**
 * Retrieves all comments for a document, including resolved ones
 * @param {string} documentId - The ID of the document
 * @returns {Promise<Array>} - Array of comment documents
 */
export const getAllDocumentComments = async (documentId) => {
  try {
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('documentId', '==', documentId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all document comments:', error);
    throw error;
  }
};

/**
 * Updates a comment
 * @param {string} commentId - The ID of the comment to update
 * @param {object} commentData - New data for the comment
 * @returns {Promise<boolean>} - Success status
 */
export const updateComment = async (commentId, commentData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const commentRef = doc(db, 'comments', commentId);
    const commentSnap = await getDoc(commentRef);
    
    if (!commentSnap.exists()) {
      throw new Error('Comment not found');
    }
    
    // Verify ownership (optional - you may want to allow collaborators to edit comments too)
    const commentDoc = commentSnap.data();
    if (commentDoc.createdBy !== user.uid) {
      throw new Error('Only the comment author can edit this comment');
    }
    
    // Update the comment
    await updateDoc(commentRef, {
      ...commentData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

/**
 * Resolves/unresolves a comment
 * @param {string} commentId - The ID of the comment to resolve
 * @param {boolean} resolved - Whether to mark the comment as resolved
 * @returns {Promise<boolean>} - Success status
 */
export const resolveComment = async (commentId, resolved = true) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const commentRef = doc(db, 'comments', commentId);
    
    await updateDoc(commentRef, {
      resolved: resolved,
      resolvedBy: resolved ? user.uid : null,
      resolvedByEmail: resolved ? user.email : null,
      resolvedAt: resolved ? serverTimestamp() : null,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error resolving comment:', error);
    throw error;
  }
};

/**
 * Deletes a comment
 * @param {string} commentId - The ID of the comment to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteComment = async (commentId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const commentRef = doc(db, 'comments', commentId);
    const commentSnap = await getDoc(commentRef);
    
    if (!commentSnap.exists()) {
      throw new Error('Comment not found');
    }
    
    // Verify ownership
    const commentDoc = commentSnap.data();
    if (commentDoc.createdBy !== user.uid) {
      throw new Error('Only the comment author can delete this comment');
    }
    
    await deleteDoc(commentRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}; 