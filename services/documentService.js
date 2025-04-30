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
  
  // Collection reference
  const documentsCollection = collection(db, 'documents');
  
  // Create a new document
  export async function createDocument(title, userId) {
    return addDoc(documentsCollection, {
      title,
      content: JSON.stringify({ blocks: [], entityMap: {} }), // Empty Draft.js content
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      collaborators: [userId]
    });
  }
  
  // Get a single document by ID
  export async function getDocument(documentId) {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Document not found");
    }
  }
  
  // Update document content
  export async function updateDocumentContent(documentId, contentState) {
    const docRef = doc(db, 'documents', documentId);
    return updateDoc(docRef, {
      content: JSON.stringify(contentState),
      updatedAt: serverTimestamp()
    });
  }
  
  // Get all documents available to a user
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
  
  // Add a collaborator to a document
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
  
  // Delete a document
  export async function deleteDocument(documentId) {
    return deleteDoc(doc(db, 'documents', documentId));
  }