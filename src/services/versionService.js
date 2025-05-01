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
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Creates a version snapshot of a document
 * @param {string} documentId - The ID of the document
 * @param {object} versionData - Data for the version
 * @returns {Promise<string>} - ID of the created version
 */
export const createVersion = async (documentId, versionData) => {
  try {

    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const versionsRef = collection(db, 'versions');
    const versionDoc = await addDoc(versionsRef, {
      documentId,
      content: versionData.content,
      updatedBy: versionData.updatedBy || user.email,
      createdAt: versionData.createdAt || serverTimestamp(),
      title: versionData.title || 'Untitled Document'
    });

    return versionDoc.id;
  } catch (error) {
    console.error('Error creating version:', error);
    throw error;
  }
};

/**
 * Retrieves version history for a document
 * @param {string} documentId - The ID of the document
 * @returns {Promise<Array>} - Array of version documents
 */
export const getVersionHistory = async (documentId) => {
  try {
    const versionsRef = collection(db, 'versions');
    const q = query(
      versionsRef,
      where('documentId', '==', documentId),
      orderBy('createdAt', 'desc')
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
    console.error('Error getting version history:', error);
    throw error;
  }
};

/**
 * Restores a document to a previous version
 * @param {string} documentId - The ID of the document
 * @param {string} versionId - The ID of the version to restore
 * @returns {Promise<boolean>} - Success status
 */
export const restoreVersion = async (documentId, versionId) => {
  try {

    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');


    const versionRef = doc(db, 'versions', versionId);
    const versionSnap = await getDoc(versionRef);
    
    if (!versionSnap.exists()) {
      throw new Error('Version not found');
    }
    
    const versionData = versionSnap.data();

    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }

    const docData = docSnap.data();
    
 
    await createVersion(documentId, {
      content: docData.content,
      updatedBy: user.email,
      createdAt: new Date(),
      title: docData.title,
      isRestorationPoint: true
    });
    

    await updateDoc(docRef, {
      content: versionData.content,
      updateAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error restoring version:', error);
    throw error;
  }
}; 