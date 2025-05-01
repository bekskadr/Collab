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
  
 
  export async function createVersionSnapshot(documentId, content, userId) {
    const versionsCollection = collection(db, 'documents', documentId, 'versions');
    
    return addDoc(versionsCollection, {
      content,
      createdBy: userId,
      createdAt: serverTimestamp()
    });
  }
  
 
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
  

  export async function restoreVersion(documentId, versionId) {
 
    const versionRef = doc(db, 'documents', documentId, 'versions', versionId);
    const versionSnap = await getDoc(versionRef);
    
    if (versionSnap.exists()) {
      const { content } = versionSnap.data();
      
      const docRef = doc(db, 'documents', documentId);
      return updateDoc(docRef, {
        content,
        updatedAt: serverTimestamp()
      });
    } else {
      throw new Error("Version not found");
    }
  }