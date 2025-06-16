import { logger } from './logger.js';

const linkedinLogger = logger.child('LINKEDIN-API');

export class LinkedInAPI {
  constructor() {
    this.baseUrl = 'https://api.linkedin.com/v2';
  }

  /**
   * Post content to LinkedIn
   * @param {string} accessToken - LinkedIn access token
   * @param {string} authorId - LinkedIn URN (person or organization ID)
   * @param {string} text - Post text content
   * @param {string|null} imageUrl - Optional image URL
   * @param {string} articleUrl - Original article URL for link preview
   * @param {boolean} isOrganizationPost - Whether this is an organization post
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async postToLinkedIn(accessToken, authorId, text, imageUrl = null, articleUrl = null, isOrganizationPost = false) {
    linkedinLogger.entry('postToLinkedIn', { 
      hasAccessToken: !!accessToken,
      hasAuthorId: !!authorId,
      textLength: text?.length,
      hasImage: !!imageUrl,
      hasArticleUrl: !!articleUrl,
      isOrganizationPost
    });

    try {
      // Validate inputs
      if (!accessToken || !authorId || !text) {
        throw new Error('Missing required parameters: accessToken, authorId, or text');
      }

      // Validate scopes based on post type
      const requiredScopes = isOrganizationPost 
        ? ['w_organization_social']
        : ['w_member_social'];
      
      const scopeValidation = await this.validateTokenScopes(accessToken, requiredScopes);
      if (!scopeValidation.success) {
        throw new Error(scopeValidation.error);
      }

      let postData;

      if (imageUrl) {
        // Post with image
        linkedinLogger.debug('Creating post with image');
        
        // First, upload the image
        const imageAsset = await this.uploadImage(accessToken, authorId, imageUrl);
        
        postData = {
          author: authorId,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: text
              },
              shareMediaCategory: 'IMAGE',
              media: [
                {
                  status: 'READY',
                  media: imageAsset,
                  title: {
                    text: 'Health News Image'
                  }
                }
              ]
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        };
      } else if (articleUrl) {
        // Post with article link preview
        linkedinLogger.debug('Creating post with article link');
        
        postData = {
          author: authorId,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: text
              },
              shareMediaCategory: 'ARTICLE',
              media: [
                {
                  status: 'READY',
                  originalUrl: articleUrl,
                  title: {
                    text: 'Health News Article'
                  }
                }
              ]
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        };
      } else {
        // Text-only post
        linkedinLogger.debug('Creating text-only post');
        
        postData = {
          author: authorId,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: text
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        };
      }

      // Make the API call
      const response = await fetch(`${this.baseUrl}/ugcPosts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        linkedinLogger.error('LinkedIn API error', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorData 
        });
        throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      linkedinLogger.info('Successfully posted to LinkedIn', { postId: result.id });

      return {
        success: true,
        data: result
      };

    } catch (error) {
      linkedinLogger.error('Error posting to LinkedIn', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload an image to LinkedIn for use in posts
   * @param {string} accessToken - LinkedIn access token
   * @param {string} authorId - LinkedIn URN (person or organization ID)
   * @param {string} imageUrl - URL of image to upload
   * @returns {Promise<string>} - LinkedIn asset URN
   */
  async uploadImage(accessToken, authorId, imageUrl) {
    linkedinLogger.entry('uploadImage', { imageUrl });

    try {
      // Step 1: Register upload
      const registerResponse = await fetch(`${this.baseUrl}/assets?action=registerUpload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: authorId,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent'
              }
            ]
          }
        })
      });

      if (!registerResponse.ok) {
        throw new Error(`Failed to register upload: ${registerResponse.statusText}`);
      }

      const registerData = await registerResponse.json();
      const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = registerData.value.asset;

      // Step 2: Fetch the image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();

      // Step 3: Upload the image
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream'
        },
        body: imageBuffer
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
      }

      linkedinLogger.info('Successfully uploaded image to LinkedIn', { asset });
      return asset;

    } catch (error) {
      linkedinLogger.error('Error uploading image to LinkedIn', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user profile information
   * @param {string} accessToken - LinkedIn access token
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getUserProfile(accessToken) {
    linkedinLogger.entry('getUserProfile');

    try {
      const response = await fetch(`${this.baseUrl}/people/(id~)`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user profile: ${response.statusText}`);
      }

      const data = await response.json();
      linkedinLogger.info('Successfully retrieved user profile');

      return {
        success: true,
        data: data
      };

    } catch (error) {
      linkedinLogger.error('Error getting user profile', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get organization URNs where the user is an administrator
   * @param {string} accessToken - LinkedIn access token with rw_organization_admin scope
   * @returns {Promise<{success: boolean, data?: string[], error?: string}>}
   */
  async getOrganizationUrns(accessToken) {
    linkedinLogger.entry('getOrganizationUrns');

    try {
      const response = await fetch(
        `${this.baseUrl}/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        linkedinLogger.error('Failed to fetch org URNs', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorText 
        });
        throw new Error(`Failed to fetch org URNs: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const organizationUrns = data.elements
        .map(e => e.organizationalTarget)
        .filter(urn => urn.startsWith('urn:li:organization:'));

      linkedinLogger.info('Successfully retrieved organization URNs', { count: organizationUrns.length });
      return {
        success: true,
        data: organizationUrns
      };

    } catch (error) {
      linkedinLogger.error('Error fetching organization URNs', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate if the access token has required scopes
   * @param {string} accessToken - LinkedIn access token
   * @param {string[]} requiredScopes - Array of required scope strings
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async validateTokenScopes(accessToken, requiredScopes) {
    linkedinLogger.entry('validateTokenScopes', { requiredScopes });

    try {
      // Get token information from LinkedIn's introspection endpoint
      const response = await fetch(`${this.baseUrl}/oauth/introspect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `token=${accessToken}`
      });

      if (!response.ok) {
        throw new Error(`Failed to introspect token: ${response.status}`);
      }

      const data = await response.json();
      const tokenScopes = data.scope.split(' ');

      // Check if all required scopes are present
      const missingScopes = requiredScopes.filter(scope => !tokenScopes.includes(scope));
      
      if (missingScopes.length > 0) {
        return {
          success: false,
          error: `Access token missing required scopes: ${missingScopes.join(', ')}`
        };
      }

      return { success: true };

    } catch (error) {
      linkedinLogger.error('Error validating token scopes', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }
} 