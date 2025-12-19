import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { zip, unzip } from 'react-native-zip-archive';

const DOCUMENTS_DIR = `${FileSystemLegacy.documentDirectory}investment_documents/`;

// Ensure documents directory exists
export const initializeDocumentStorage = async () => {
  try {
    const dirInfo = await FileSystemLegacy.getInfoAsync(DOCUMENTS_DIR);
    if (!dirInfo.exists) {
      await FileSystemLegacy.makeDirectoryAsync(DOCUMENTS_DIR, { intermediates: true });
      console.log('Documents directory created');
    }
  } catch (error) {
    console.error('Error initializing document storage:', error);
  }
};

// Get investment-specific directory
const getInvestmentDocDir = (investmentId) => {
  return `${DOCUMENTS_DIR}investment_${investmentId}/`;
};

// Pick a document from device
export const pickDocument = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('Error picking document:', error);
    throw error;
  }
};

// Save document for an investment
export const saveDocument = async (investmentId, documentUri, documentName) => {
  try {
    await initializeDocumentStorage();

    const investmentDir = getInvestmentDocDir(investmentId);
    const dirInfo = await FileSystemLegacy.getInfoAsync(investmentDir);

    if (!dirInfo.exists) {
      await FileSystemLegacy.makeDirectoryAsync(investmentDir, { intermediates: true });
    }

    // Create unique filename
    const timestamp = Date.now();
    const extension = documentName.split('.').pop();
    const filename = `${timestamp}_${documentName}`;
    const destinationUri = `${investmentDir}${filename}`;

    // Copy file to app's document directory
    await FileSystemLegacy.copyAsync({
      from: documentUri,
      to: destinationUri,
    });

    return {
      id: timestamp.toString(),
      name: documentName,
      uri: destinationUri,
      size: 0, // Will be populated when reading
      addedDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error saving document:', error);
    throw error;
  }
};

// Get all documents for an investment
export const getInvestmentDocuments = async (investmentId) => {
  try {
    const investmentDir = getInvestmentDocDir(investmentId);
    const dirInfo = await FileSystemLegacy.getInfoAsync(investmentDir);

    if (!dirInfo.exists) {
      return [];
    }

    const files = await FileSystemLegacy.readDirectoryAsync(investmentDir);

    const documents = await Promise.all(
      files.map(async (filename) => {
        const fileUri = `${investmentDir}${filename}`;
        const fileInfo = await FileSystemLegacy.getInfoAsync(fileUri);

        // Extract original name from timestamped filename
        const parts = filename.split('_');
        const timestamp = parts[0];
        const originalName = parts.slice(1).join('_');

        return {
          id: timestamp,
          name: originalName,
          uri: fileUri,
          size: fileInfo.size || 0,
          addedDate: new Date(parseInt(timestamp)).toISOString(),
        };
      })
    );

    return documents.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
  } catch (error) {
    console.error('Error getting investment documents:', error);
    return [];
  }
};

// Delete a specific document
export const deleteDocument = async (investmentId, documentId) => {
  try {
    const investmentDir = getInvestmentDocDir(investmentId);
    const files = await FileSystemLegacy.readDirectoryAsync(investmentDir);

    const fileToDelete = files.find(f => f.startsWith(`${documentId}_`));

    if (fileToDelete) {
      const fileUri = `${investmentDir}${fileToDelete}`;
      await FileSystemLegacy.deleteAsync(fileUri);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Delete all documents for an investment
export const deleteInvestmentDocuments = async (investmentId) => {
  try {
    const investmentDir = getInvestmentDocDir(investmentId);
    const dirInfo = await FileSystemLegacy.getInfoAsync(investmentDir);

    if (dirInfo.exists) {
      await FileSystemLegacy.deleteAsync(investmentDir, { idempotent: true });
    }
  } catch (error) {
    console.error('Error deleting investment documents:', error);
    throw error;
  }
};

// Get total size of all documents for an investment
export const getInvestmentDocumentsSize = async (investmentId) => {
  try {
    const documents = await getInvestmentDocuments(investmentId);
    return documents.reduce((total, doc) => total + (doc.size || 0), 0);
  } catch (error) {
    console.error('Error calculating documents size:', error);
    return 0;
  }
};

// Format file size for display
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Get file type from filename
export const getFileType = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();

  if (['pdf'].includes(extension)) return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';

  return 'other';
};

// Export all documents as a ZIP file
export const exportAllDocuments = async () => {
  try {
    const dirInfo = await FileSystemLegacy.getInfoAsync(DOCUMENTS_DIR);

    if (!dirInfo.exists) {
      // No documents to export
      return null;
    }

    // Create ZIP file in cache directory
    const zipPath = `${FileSystemLegacy.cacheDirectory}documents.zip`;

    // Delete existing zip if it exists
    const zipInfo = await FileSystemLegacy.getInfoAsync(zipPath);
    if (zipInfo.exists) {
      await FileSystemLegacy.deleteAsync(zipPath);
    }

    // Create ZIP from documents directory
    await zip(DOCUMENTS_DIR, zipPath);

    return zipPath;
  } catch (error) {
    console.error('Error exporting documents:', error);
    throw error;
  }
};

// Import documents from a ZIP file
export const importDocuments = async (zipUri) => {
  try {
    // Clear existing documents
    const dirInfo = await FileSystemLegacy.getInfoAsync(DOCUMENTS_DIR);
    if (dirInfo.exists) {
      await FileSystemLegacy.deleteAsync(DOCUMENTS_DIR, { idempotent: true });
    }

    // Recreate documents directory
    await FileSystemLegacy.makeDirectoryAsync(DOCUMENTS_DIR, { intermediates: true });

    // Unzip documents to documents directory
    await unzip(zipUri, DOCUMENTS_DIR);

    return true;
  } catch (error) {
    console.error('Error importing documents:', error);
    throw error;
  }
};

// Get total count of all documents
export const getTotalDocumentCount = async () => {
  try {
    const dirInfo = await FileSystemLegacy.getInfoAsync(DOCUMENTS_DIR);
    if (!dirInfo.exists) {
      return 0;
    }

    const investmentDirs = await FileSystemLegacy.readDirectoryAsync(DOCUMENTS_DIR);
    let totalCount = 0;

    for (const dir of investmentDirs) {
      const investmentDir = `${DOCUMENTS_DIR}${dir}/`;
      const investmentDirInfo = await FileSystemLegacy.getInfoAsync(investmentDir);

      if (investmentDirInfo.isDirectory) {
        const files = await FileSystemLegacy.readDirectoryAsync(investmentDir);
        totalCount += files.length;
      }
    }

    return totalCount;
  } catch (error) {
    console.error('Error getting total document count:', error);
    return 0;
  }
};
