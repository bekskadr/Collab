import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    getDocs, 
    serverTimestamp 
  } from 'firebase/firestore';
  import { db } from '../firebase';
  
  // Create a new version snapshot
  export async function createVersionSnapshot(documentId, content, userId) {
    const versionsCollection = collection(db, 'documents', documentId, 'versions');
    
    return addDoc(versionsCollection, {
      content,
      createdBy: userId,
      createdAt: serverTimestamp()
    });
  }
  
  // Get version history for a document
  export async function getVersionHistory(documentId) {
    const versionsCollection = collection(db, 'documents', documentId, 'versions');
    const q = query(
      versionsCollection,
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  // Restore a specific version
  export async function restoreVersion(documentId, versionId) {
    // First get the version data
    const versionRef = doc(db, 'documents', documentId, 'versions', versionId);
    const versionSnap = await getDoc(versionRef);
    
    if (versionSnap.exists()) {
      const { content } = versionSnap.data();
      
      // Update the current document with this version's content
      const docRef = doc(db, 'documents', documentId);
      return updateDoc(docRef, {
        content,
        updatedAt: serverTimestamp()
      });
    } else {
      throw new Error("Version not found");
    }
  }