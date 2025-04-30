import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  getDoc, 
  doc, 
  query, 
  where,
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Saves a drawing to Firestore
 * @param {string} documentId - The ID of the document
 * @param {object} drawingData - The drawing data to save
 * @returns {Promise<string>} - ID of the saved drawing
 */
export const saveDrawing = async (documentId, drawingData) => {
  try {
    if (!auth.currentUser) throw new Error("User must be authenticated to save a drawing");
    
    const drawingRef = await addDoc(collection(db, "drawings"), {
      documentId,
      createdBy: auth.currentUser.uid,
      createdAt: new Date(),
      paths: drawingData.paths || []
    });
    
    return drawingRef.id;
  } catch (error) {
    console.error("Error saving drawing:", error);
    throw error;
  }
};

/**
 * Updates an existing drawing
 * @param {string} drawingId - The ID of the drawing to update
 * @param {object} drawingData - The updated drawing data
 * @returns {Promise<boolean>} - Success status
 */
export const updateDrawing = async (drawingId, updateData) => {
  try {
    if (!auth.currentUser) throw new Error("User must be authenticated to update a drawing");
    
    const drawingRef = doc(db, "drawings", drawingId);
    
    // Verify the drawing exists and belongs to the current user
    const drawingDoc = await getDoc(drawingRef);
    if (!drawingDoc.exists()) {
      throw new Error("Drawing not found");
    }
    
    // Allow update even if this is a shared document
    // This ensures shared users can also update their drawings
    await updateDoc(drawingRef, updateData);
    
    return drawingId;
  } catch (error) {
    console.error("Error updating drawing:", error);
    throw error;
  }
};

/**
 * Gets all drawings for a document
 * @param {string} documentId - The ID of the document
 * @returns {Promise<Array>} - Array of drawing documents
 */
export const getDocumentDrawings = async (documentId) => {
  try {
    const drawingsRef = collection(db, 'drawings');
    const q = query(
      drawingsRef,
      where('documentId', '==', documentId)
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
    console.error('Error getting document drawings:', error);
    throw error;
  }
};

/**
 * Sets up a real-time listener for drawings in a document
 * @param {string} documentId - The ID of the document
 * @param {function} callback - Callback to handle updated drawings data
 * @returns {function} - Unsubscribe function
 */
export const subscribeToDrawings = (documentId, callback) => {
  try {
    const drawingsRef = collection(db, 'drawings');
    const q = query(
      drawingsRef,
      where('documentId', '==', documentId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const drawings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(drawings);
    }, (error) => {
      console.error('Error subscribing to drawings:', error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up drawings subscription:', error);
    throw error;
  }
};

/**
 * Adds a new path to an existing drawing
 * @param {string} drawingId - The ID of the drawing
 * @param {object} pathData - The new path data
 * @returns {Promise<boolean>} - Success status
 */
export const addPathToDrawing = async (drawingId, pathData) => {
  try {
    const drawingRef = doc(db, 'drawings', drawingId);
    const drawingSnap = await getDoc(drawingRef);
    
    if (!drawingSnap.exists()) {
      throw new Error('Drawing not found');
    }
    
    const drawingData = drawingSnap.data();
    const currentPaths = drawingData.paths || [];
    
    await updateDoc(drawingRef, {
      paths: [...currentPaths, pathData],
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error adding path to drawing:', error);
    throw error;
  }
};

/**
 * Deletes a drawing
 * @param {string} drawingId - The ID of the drawing to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteDrawing = async (drawingId) => {
  try {
    const drawingRef = doc(db, 'drawings', drawingId);
    await deleteDoc(drawingRef);
    return true;
  } catch (error) {
    console.error('Error deleting drawing:', error);
    throw error;
  }
}; 