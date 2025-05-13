import { google, docs_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../../../utils/logger';
import config from '../../../config';
import { GoogleDoc } from '../../../types';

/**
 * Google Docs Integration
 * 
 * Provides functionality to interact with Google Docs API
 */

// Initialize Google Docs API
const getDocsApi = (auth: OAuth2Client): docs_v1.Docs => {
  return google.docs({ version: 'v1', auth });
};

// Initialize Google Drive API for document management
const getDriveApi = (auth: OAuth2Client): any => {
  return google.drive({ version: 'v3', auth });
};

/**
 * Create a new Google Doc
 * 
 * @param {OAuth2Client} auth - Authenticated Google OAuth2 client
 * @param {Object} docData - Document data
 * @returns {Promise<GoogleDoc>} Created document
 */
export const createDocument = async (
  auth: OAuth2Client,
  docData: {
    title: string;
    content?: string;
    folderId?: string;
  }
): Promise<GoogleDoc> => {
  try {
    // Use Drive API to create an empty document
    const drive = getDriveApi(auth);
    
    // Create document metadata
    const fileMetadata = {
      name: docData.title,
      mimeType: 'application/vnd.google-apps.document',
      parents: docData.folderId ? [docData.folderId] : undefined
    };
    
    logger.info(`Creating Google Doc: ${docData.title}`);
    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, webViewLink, createdTime, modifiedTime, parents, owners'
    });
    
    if (!file.data || !file.data.id) {
      throw new Error('Failed to create Google Doc');
    }
    
    // If content was provided, update the document content
    if (docData.content) {
      await updateDocumentContent(auth, file.data.id, docData.content);
    }
    
    // Get folder name if folderId was provided
    let folderName;
    if (docData.folderId) {
      try {
        const folder = await drive.files.get({
          fileId: docData.folderId,
          fields: 'name'
        });
        folderName = folder.data.name;
      } catch (error) {
        logger.warn(`Could not get folder name for folder ${docData.folderId}:`, error);
      }
    }
    
    // Get permissions
    const permissionsResponse = await drive.permissions.list({
      fileId: file.data.id,
      fields: 'permissions(emailAddress, role, type)'
    });
    
    const permissions = permissionsResponse.data.permissions?.map(p => ({
      email: p.emailAddress || '',
      role: (p.role as 'owner' | 'writer' | 'commenter' | 'reader'),
      type: (p.type as 'user' | 'group' | 'domain' | 'anyone')
    })) || [];
    
    // Return the created document
    return {
      id: file.data.id,
      title: file.data.name || docData.title,
      url: file.data.webViewLink || `https://docs.google.com/document/d/${file.data.id}/edit`,
      createdAt: file.data.createdTime || new Date().toISOString(),
      updatedAt: file.data.modifiedTime || new Date().toISOString(),
      folderId: docData.folderId,
      folderName,
      owner: {
        email: file.data.owners?.[0]?.emailAddress || '',
        name: file.data.owners?.[0]?.displayName
      },
      permissions
    };
    
  } catch (error) {
    logger.error('Error creating Google Doc:', error);
    throw error;
  }
};

/**
 * Get a Google Doc by ID
 * 
 * @param {OAuth2Client} auth - Authenticated Google OAuth2 client
 * @param {string} documentId - Document ID
 * @returns {Promise<GoogleDoc>} Document information
 */
export const getDocument = async (
  auth: OAuth2Client,
  documentId: string
): Promise<GoogleDoc> => {
  try {
    const drive = getDriveApi(auth);
    
    logger.info(`Getting Google Doc: ${documentId}`);
    const file = await drive.files.get({
      fileId: documentId,
      fields: 'id, name, webViewLink, createdTime, modifiedTime, parents, owners'
    });
    
    if (!file.data || !file.data.id) {
      throw new Error(`Document ${documentId} not found`);
    }
    
    // Get folder information if available
    let folderId;
    let folderName;
    if (file.data.parents && file.data.parents.length > 0) {
      folderId = file.data.parents[0];
      try {
        const folder = await drive.files.get({
          fileId: folderId,
          fields: 'name'
        });
        folderName = folder.data.name;
      } catch (error) {
        logger.warn(`Could not get folder name for folder ${folderId}:`, error);
      }
    }
    
    // Get permissions
    const permissionsResponse = await drive.permissions.list({
      fileId: documentId,
      fields: 'permissions(emailAddress, role, type)'
    });
    
    const permissions = permissionsResponse.data.permissions?.map(p => ({
      email: p.emailAddress || '',
      role: (p.role as 'owner' | 'writer' | 'commenter' | 'reader'),
      type: (p.type as 'user' | 'group' | 'domain' | 'anyone')
    })) || [];
    
    return {
      id: documentId,
      title: file.data.name || '',
      url: file.data.webViewLink || `https://docs.google.com/document/d/${documentId}/edit`,
      createdAt: file.data.createdTime || '',
      updatedAt: file.data.modifiedTime || '',
      folderId,
      folderName,
      owner: {
        email: file.data.owners?.[0]?.emailAddress || '',
        name: file.data.owners?.[0]?.displayName
      },
      permissions
    };
    
  } catch (error) {
    logger.error(`Error getting Google Doc ${documentId}:`, error);
    throw error;
  }
};

/**
 * Update document content
 * 
 * @param {OAuth2Client} auth - Authenticated Google OAuth2 client
 * @param {string} documentId - Document ID
 * @param {string} content - Document content
 * @returns {Promise<void>}
 */
export const updateDocumentContent = async (
  auth: OAuth2Client,
  documentId: string,
  content: string
): Promise<void> => {
  try {
    const docs = getDocsApi(auth);
    
    logger.info(`Updating content for Google Doc ${documentId}`);
    
    // First, get the document to check its current content
    const document = await docs.documents.get({
      documentId
    });
    
    // If the document has content, we need to delete it first
    if (document.data.body?.content && document.data.body.content.length > 1) {
      // The first content element is usually the document body
      // Find the end index of the content (excluding the last paragraph)
      const endIndex = document.data.body.content[document.data.body.content.length - 1].endIndex || 1;
      
      // Delete existing content
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              deleteContentRange: {
                range: {
                  startIndex: 1,
                  endIndex: endIndex - 1
                }
              }
            }
          ]
        }
      });
    }
    
    // Insert new content
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: 1
              },
              text: content
            }
          }
        ]
      }
    });
    
  } catch (error) {
    logger.error(`Error updating content for Google Doc ${documentId}:`, error);
    throw error;
  }
};

/**
 * Append content to a document
 * 
 * @param {OAuth2Client} auth - Authenticated Google OAuth2 client
 * @param {string} documentId - Document ID
 * @param {string} content - Content to append
 * @returns {Promise<void>}
 */
export const appendDocumentContent = async (
  auth: OAuth2Client,
  documentId: string,
  content: string
): Promise<void> => {
  try {
    const docs = getDocsApi(auth);
    
    logger.info(`Appending content to Google Doc ${documentId}`);
    
    // Get the document to find the end index
    const document = await docs.documents.get({
      documentId
    });
    
    // Find the end index of the document
    const endIndex = document.data.body?.content?.[document.data.body.content.length - 1]?.endIndex || 1;
    
    // Append content at the end
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: endIndex - 1
              },
              text: content
            }
          }
        ]
      }
    });
    
  } catch (error) {
    logger.error(`Error appending content to Google Doc ${documentId}:`, error);
    throw error;
  }
};

/**
 * Share a document with users
 * 
 * @param {OAuth2Client} auth - Authenticated Google OAuth2 client
 * @param {string} documentId - Document ID
 * @param {Array<{email: string, role: string}>} permissions - Permissions to add
 * @returns {Promise<boolean>} Success status
 */
export const shareDocument = async (
  auth: OAuth2Client,
  documentId: string,
  permissions: Array<{
    email: string;
    role: 'writer' | 'commenter' | 'reader';
  }>
): Promise<boolean> => {
  try {
    const drive = getDriveApi(auth);
    
    logger.info(`Sharing Google Doc ${documentId} with ${permissions.length} users`);
    
    // Add each permission
    const results = await Promise.all(
      permissions.map(permission =>
        drive.permissions.create({
          fileId: documentId,
          requestBody: {
            type: 'user',
            role: permission.role,
            emailAddress: permission.email
          },
          fields: 'id'
        })
      )
    );
    
    return results.every(result => !!result.data);
    
  } catch (error) {
    logger.error(`Error sharing Google Doc ${documentId}:`, error);
    throw error;
  }
};

/**
 * Create a document from a template
 * 
 * @param {OAuth2Client} auth - Authenticated Google OAuth2 client
 * @param {string} templateId - Template document ID
 * @param {Object} docData - Document data
 * @returns {Promise<GoogleDoc>} Created document
 */
export const createFromTemplate = async (
  auth: OAuth2Client,
  templateId: string,
  docData: {
    title: string;
    folderId?: string;
    placeholders?: Record<string, string>;
  }
): Promise<GoogleDoc> => {
  try {
    const drive = getDriveApi(auth);
    
    logger.info(`Creating Google Doc from template ${templateId}`);
    
    // Copy the template
    const copy = await drive.files.copy({
      fileId: templateId,
      requestBody: {
        name: docData.title,
        parents: docData.folderId ? [docData.folderId] : undefined
      },
      fields: 'id'
    });
    
    if (!copy.data || !copy.data.id) {
      throw new Error('Failed to copy template document');
    }
    
    // Replace placeholders if provided
    if (docData.placeholders && Object.keys(docData.placeholders).length > 0) {
      const docs = getDocsApi(auth);
      
      // Get the document content
      const document = await docs.documents.get({
        documentId: copy.data.id
      });
      
      // Create batch update requests for each placeholder
      const requests = Object.entries(docData.placeholders).map(([key, value]) => {
        const placeholder = `{{${key}}}`;
        
        return {
          replaceAllText: {
            containsText: {
              text: placeholder,
              matchCase: true
            },
            replaceText: value
          }
        };
      });
      
      // Apply the updates
      if (requests.length > 0) {
        await docs.documents.batchUpdate({
          documentId: copy.data.id,
          requestBody: { requests }
        });
      }
    }
    
    // Get the full document details
    return getDocument(auth, copy.data.id);
    
  } catch (error) {
    logger.error('Error creating document from template:', error);
    throw error;
  }
};

/**
 * List documents
 * 
 * @param {OAuth2Client} auth - Authenticated Google OAuth2 client
 * @param {Object} options - List options
 * @returns {Promise<GoogleDoc[]>} List of documents
 */
export const listDocuments = async (
  auth: OAuth2Client,
  options: {
    folderId?: string;
    maxResults?: number;
    query?: string;
  } = {}
): Promise<GoogleDoc[]> => {
  try {
    const drive = getDriveApi(auth);
    
    // Build the query
    let query = "mimeType='application/vnd.google-apps.document'";
    
    if (options.folderId) {
      query += ` and '${options.folderId}' in parents`;
    }
    
    if (options.query) {
      query += ` and name contains '${options.query}'`;
    }
    
    logger.info(`Listing Google Docs with query: ${query}`);
    const response = await drive.files.list({
      q: query,
      pageSize: options.maxResults || 50,
      fields: 'files(id, name, webViewLink, createdTime, modifiedTime, parents, owners)'
    });
    
    if (!response.data.files) {
      return [];
    }
    
    // Map to GoogleDoc format
    const docs = await Promise.all(
      response.data.files.map(async (file) => {
        // Get folder information if available
        let folderName;
        if (file.parents && file.parents.length > 0) {
          const folderId = file.parents[0];
          try {
            const folder = await drive.files.get({
              fileId: folderId,
              fields: 'name'
            });
            folderName = folder.data.name;
          } catch (error) {
            logger.warn(`Could not get folder name for folder ${folderId}:`, error);
          }
        }
        
        // Get permissions
        const permissionsResponse = await drive.permissions.list({
          fileId: file.id!,
          fields: 'permissions(emailAddress, role, type)'
        });
        
        const permissions = permissionsResponse.data.permissions?.map(p => ({
          email: p.emailAddress || '',
          role: (p.role as 'owner' | 'writer' | 'commenter' | 'reader'),
          type: (p.type as 'user' | 'group' | 'domain' | 'anyone')
        })) || [];
        
        return {
          id: file.id!,
          title: file.name || '',
          url: file.webViewLink || `https://docs.google.com/document/d/${file.id}/edit`,
          createdAt: file.createdTime || '',
          updatedAt: file.modifiedTime || '',
          folderId: file.parents?.[0],
          folderName,
          owner: {
            email: file.owners?.[0]?.emailAddress || '',
            name: file.owners?.[0]?.displayName
          },
          permissions
        };
      })
    );
    
    return docs;
    
  } catch (error) {
    logger.error('Error listing Google Docs:', error);
    throw error;
  }
};