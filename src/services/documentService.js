import { db, auth, storage } from '../firebase';
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
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { getUserIdByEmail } from './userService';
import { createVersion } from './versionService';

// Create a new document
export const createDocument = async (documentData) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }

    const userId = auth.currentUser.uid;
    const document = {
      ...documentData,
      owner: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sharedWith: []
    };

    const docRef = doc(collection(db, 'documents'));
    await setDoc(docRef, document);

    return docRef.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

// Fetch all documents for a user (both owned and shared)
export const fetchUserDocuments = async (userId) => {
  try {
    // Get documents owned by the user
    const ownedDocsQuery = query(
      collection(db, 'documents'),
      where('owner', '==', userId)
    );
    const ownedDocsSnapshot = await getDocs(ownedDocsQuery);
    
    // Get documents shared with the user
    const sharedDocsQuery = query(
      collection(db, 'documents'),
      where('sharedWith', 'array-contains', { email: auth.currentUser.email })
    );
    const sharedDocsSnapshot = await getDocs(sharedDocsQuery);
    
    // Combine both sets of documents
    const documents = [];
    
    ownedDocsSnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    
    sharedDocsSnapshot.forEach((doc) => {
      // Only add if not already added (should not happen, but just in case)
      if (!documents.some(d => d.id === doc.id)) {
        documents.push({ id: doc.id, ...doc.data() });
      }
    });
    
    return documents;
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
};

// Fetch a single document by ID
export const fetchDocument = async (documentId) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching document:', error);
    return null;
  }
};

// Update a document
export const updateDocument = async (documentId, updates) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    
    // Add updated timestamp
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(docRef, updatedData);
    
    // Create a version history entry
    if (updates.content) {
      const versionRef = doc(collection(db, 'documents', documentId, 'versions'));
      await setDoc(versionRef, {
        content: updates.content,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser ? auth.currentUser.email : 'Unknown'
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

// Delete a document
export const deleteDocument = async (documentId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }
    
    // Check if the current user is the owner
    const document = await fetchDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }
    
    if (document.owner !== auth.currentUser.uid) {
      throw new Error('Only the owner can delete a document');
    }
    
    await deleteDoc(doc(db, 'documents', documentId));
    
    return { success: true, documentId };
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Share a document with another user
export const shareDocument = async (documentId, email, permission) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }
    
    const docRef = doc(db, 'documents', documentId);
    
    // First check if document exists and current user is the owner
    const document = await fetchDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }
    
    if (document.owner !== auth.currentUser.uid) {
      throw new Error('Only the owner can share a document');
    }
    
    // Check if user is already in the shared list
    const existingShare = document.sharedWith?.find(share => share.email === email);
    
    if (existingShare) {
      // Update permission if user already has access
      await updateDoc(docRef, {
        sharedWith: document.sharedWith.map(share => 
          share.email === email ? { email, permission } : share
        )
      });
    } else {
      // Add new user to shared list
      await updateDoc(docRef, {
        sharedWith: arrayUnion({ email, permission })
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sharing document:', error);
    throw error;
  }
};

// Remove access for a user
export const removeAccess = async (documentId, email) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }
    
    const docRef = doc(db, 'documents', documentId);
    
    // First check if document exists and current user is the owner
    const document = await fetchDocument(documentId);
    if (!document) {
      throw new Error('Document not found');
    }
    
    if (document.owner !== auth.currentUser.uid) {
      throw new Error('Only the owner can modify sharing settings');
    }
    
    // Remove the user from the shared list
    const userShare = document.sharedWith?.find(share => share.email === email);
    
    if (userShare) {
      await updateDoc(docRef, {
        sharedWith: arrayRemove(userShare)
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error removing access:', error);
    throw error;
  }
};

// Save drawing data
export const saveDrawing = async (documentId, drawingData) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }
    
    // Upload drawing to storage
    const storageRef = ref(storage, `drawings/${documentId}`);
    await uploadString(storageRef, drawingData, 'data_url');
    
    return true;
  } catch (error) {
    console.error('Error saving drawing:', error);
    throw error;
  }
};

// Get drawing data
export const getDrawing = async (documentId) => {
  try {
    // Get drawing from storage
    const storageRef = ref(storage, `drawings/${documentId}`);
    const drawingUrl = await getDownloadURL(storageRef);
    
    return drawingUrl;
  } catch (error) {
    // If the drawing doesn't exist yet, that's okay
    console.log('No drawing found:', error);
    return null;
  }
};

// Add a comment to a document
export const addComment = async (documentId, text) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }
    
    const commentRef = doc(collection(db, 'documents', documentId, 'comments'));
    
    await setDoc(commentRef, {
      text,
      author: auth.currentUser.email,
      authorId: auth.currentUser.uid,
      createdAt: new Date().toISOString()
    });
    
    return { id: commentRef.id };
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Get comments for a document
export const fetchDocumentComments = async (documentId) => {
  try {
    const commentsSnapshot = await getDocs(
      collection(db, 'documents', documentId, 'comments')
    );
    
    const comments = [];
    commentsSnapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by creation date
    return comments.sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

// Delete a comment
export const deleteComment = async (documentId, commentId) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }
    
    // First check if the user is the author or document owner
    const commentRef = doc(db, 'documents', documentId, 'comments', commentId);
    const commentSnap = await getDoc(commentRef);
    
    if (!commentSnap.exists()) {
      throw new Error('Comment not found');
    }
    
    const comment = commentSnap.data();
    const document = await fetchDocument(documentId);
    
    // Only the comment author or document owner can delete the comment
    if (comment.authorId !== auth.currentUser.uid && document.owner !== auth.currentUser.uid) {
      throw new Error('You do not have permission to delete this comment');
    }
    
    await deleteDoc(commentRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Get version history for a document
export const getVersionHistory = async (documentId) => {
  try {
    const versionsSnapshot = await getDocs(
      collection(db, 'documents', documentId, 'versions')
    );
    
    const versions = [];
    versionsSnapshot.forEach((doc) => {
      versions.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by creation date (newest first)
    return versions.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  } catch (error) {
    console.error('Error fetching version history:', error);
    return [];
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