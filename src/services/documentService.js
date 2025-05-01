import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  arrayUnion,
  Timestamp,
  setDoc,
  serverTimestamp,
  arrayRemove
} from 'firebase/firestore';
import { getUserIdByEmail } from './userService';
import { createVersion } from './versionService';

// Create a new document
export const createDocument = async (documentData) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }

    // Ensure title is processed correctly
    const title = documentData && documentData.title ? documentData.title.trim() : 'Untitled Document';
    
    // Create timestamps now to reuse in return value
    const now = Timestamp.now();
    
    const docRef = await addDoc(collection(db, 'documents'), {
      title: title,
      content: documentData.content || '',
      ownerId: auth.currentUser.uid,
      collaborators: [auth.currentUser.uid],
      createAt: now,
      updateAt: now
    });

    // Return the created document with the same data structure
    return {
      id: docRef.id,
      title: title,
      content: documentData.content || '',
      ownerId: auth.currentUser.uid,
      collaborators: [auth.currentUser.uid],
      createAt: now,
      updateAt: now
    };
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

// Get all documents for a user (both owned and collaborated)
export const getUserDocuments = async (userId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }

    // First, try to get documents where user ID is in collaborators
    const q1 = query(
      collection(db, 'documents'),
      where('collaborators', 'array-contains', auth.currentUser.uid),
      orderBy('updateAt', 'asc')
    );

    const querySnapshot1 = await getDocs(q1);
    const documents = querySnapshot1.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Then, try to get documents where user email is in collaborators
    // But only if we have the user's email
    if (auth.currentUser.email) {
      try {
        const q2 = query(
          collection(db, 'documents'),
          where('collaborators', 'array-contains', auth.currentUser.email.toLowerCase()),
          orderBy('updateAt', 'asc')
        );

        const querySnapshot2 = await getDocs(q2);
        
        // Add documents from email query if they're not already in the result
        // (avoiding duplicates)
        const emailDocs = querySnapshot2.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Add documents that aren't already in the result (by ID)
        const existingIds = new Set(documents.map(doc => doc.id));
        for (const doc of emailDocs) {
          if (!existingIds.has(doc.id)) {
            documents.push(doc);
          }
        }
      } catch (error) {
        console.error("Error getting documents by email, continuing with UID results:", error);
      }
    }

    return documents;
  } catch (error) {
    console.error('Error getting user documents:', error);
    throw error;
  }
};

// Get a single document by ID
export const getDocument = async (documentId) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

// Update document content
export const updateDocumentContent = async (documentId, content) => {
  try {
    // Get the current user
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Get the current document for version creation
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }
    
    const docData = docSnap.data();
    
    // Update the document
    await updateDoc(docRef, {
      content: content,
      updateAt: serverTimestamp()
    });
    
    // Create a version snapshot
    await createVersion(documentId, {
      content: content,
      updatedBy: user.email,
      createdAt: new Date(),
      title: docData.title
    });
    
    return true;
  } catch (error) {
    console.error('Error updating document content:', error);
    throw error;
  }
};

// Delete a document
export const deleteDocument = async (documentId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }
    
    // Verify document exists and user is the owner
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }
    
    const docData = docSnap.data();
    if (docData.ownerId !== auth.currentUser.uid) {
      throw new Error('Only the document owner can delete this document');
    }
    
    // Delete document
    await deleteDoc(docRef);
    
    // Also clean up related collections if needed
    // E.g. delete presence subcollection, versions, etc.
    
    return { success: true, documentId };
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Add a collaborator to a document
export const addCollaborator = async (documentId, userId) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      collaborators: arrayUnion(userId),
      updateAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error adding collaborator:', error);
    throw error;
  }
};

// Add a collaborator to a document by email
export const shareDocumentByEmail = async (documentId, email) => {
  try {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if document exists and verify ownership
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }
    
    // Verify the current user is the owner
    const docData = docSnap.data();
    if (docData.ownerId !== auth.currentUser.uid) {
      throw new Error('Only the document owner can share this document');
    }
    
    // Add the email to collaborators in a single operation
    await updateDoc(docRef, {
      collaborators: arrayUnion(normalizedEmail),
      updateAt: Timestamp.now()
    });
    
    // Store the sharing information
    await addDoc(collection(db, 'pendingCollaborators'), {
      email: normalizedEmail,
      documentId,
      documentTitle: docData.title || 'Untitled Document',
      invitedAt: Timestamp.now(),
      invitedBy: auth.currentUser.uid
    });
    
    return { success: true, email: normalizedEmail };
  } catch (error) {
    console.error('Error sharing document by email:', error);
    throw error;
  }
};

// Update document title
export const updateDocumentTitle = async (documentId, title) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      title,
      updateAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating document title:', error);
    throw error;
  }
}; 