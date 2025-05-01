import { 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    deleteDoc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    serverTimestamp 
  } from 'firebase/firestore';
  import { db } from '../firebase';
  
  
  const documentsCollection = collection(db, 'documents');
  
  
  export async function createDocument(title, userId) {
    return addDoc(documentsCollection, {
      title,
      content: JSON.stringify({ blocks: [], entityMap: {} }), 
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      collaborators: [userId]
    });
  }
  
 
  export async function getDocument(documentId) {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Document not found");
    }
  }
  
 
  export async function updateDocumentContent(documentId, contentState) {
    const docRef = doc(db, 'documents', documentId);
    return updateDoc(docRef, {
      content: JSON.stringify(contentState),
      updatedAt: serverTimestamp()
    });
  }
  
  
  export async function getUserDocuments(userId) {
    const q = query(
      documentsCollection, 
      where('collaborators', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  

  export async function addCollaborator(documentId, userId) {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const { collaborators } = docSnap.data();
      if (!collaborators.includes(userId)) {
        return updateDoc(docRef, {
          collaborators: [...collaborators, userId]
        });
      }
    } else {
      throw new Error("Document not found");
    }
  }
  
 
  export async function deleteDocument(documentId) {
    return deleteDoc(doc(db, 'documents', documentId));
  }