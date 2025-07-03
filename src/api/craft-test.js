import { logger } from '../utils/logger.js';
import { CraftAPI } from '../utils/craftApi.js';
import { jsonResponse } from '../utils/response.js';

const craftTestLogger = logger.child({ module: 'CRAFT-TEST-API' });

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    try {
      logger.info('Craft CMS discovery request received');

      if (!env.CRAFT_API_TOKEN) {
        throw new Error('CRAFT_API_TOKEN not configured');
      }

      const craftApi = new CraftAPI(env.CRAFT_API_TOKEN);

      // Test connection
      logger.info('Testing Craft CMS GraphQL connection');
      await craftApi.testConnection();

      // First, let's check what users are available for authorId
      const usersQuery = `
        query GetUsers {
          users(limit: 5) {
            id
            username
            email
            admin
          }
        }
      `;

      const usersResult = await craftApi.executeGraphQL(usersQuery);
      let availableUsers = [];
      
      if (usersResult.data?.users) {
        availableUsers = usersResult.data.users;
      }

      // Now let's try a minimal entry creation to see what the validation error is
      const testMutation = `
        mutation TestMinimalEntry(
          $authorId: ID!
          $title: String!
          $enabled: Boolean
        ) {
          save_article_articleExternal_Entry(
            authorId: $authorId
            title: $title
            enabled: $enabled
          ) {
            id
            title
            slug
          }
        }
      `;

      // Use the first available user, or default to ID 1
      const testAuthorId = availableUsers.length > 0 ? availableUsers[0].id : "1";
      
      const testVariables = {
        authorId: testAuthorId,
        title: "Test Entry from Healthwatchifier API",
        enabled: true
      };

      logger.info('Attempting minimal entry creation', { authorId: testAuthorId });
      const testResult = await craftApi.executeGraphQL(testMutation, testVariables);

      // Test the specific mutation we plan to use
      const testQuery = `
        query TestMutationAvailability {
          __schema {
            mutationType {
              fields {
                name
                args {
                  name
                  type {
                    name
                    kind
                  }
                }
              }
            }
          }
        }
      `;

      const result = await craftApi.executeGraphQL(testQuery);
      
      if (result.errors) {
        throw new Error(`GraphQL schema query failed: ${JSON.stringify(result.errors)}`);
      }

      // Look for our target mutations
      const mutations = result.data.__schema?.mutationType?.fields || [];
      const articleMutations = mutations.filter(f => 
        f.name.includes('articleExternal') || f.name.includes('article')
      );

      craftTestLogger.info('Available article mutations found', { 
        totalMutations: mutations.length,
        articleMutationsCount: articleMutations.length
      });

      return jsonResponse({
        success: true,
        message: 'Craft CMS test completed!',
        users: {
          available: availableUsers,
          testAuthorId: testAuthorId
        },
        entryCreationTest: {
          success: !testResult.errors,
          errors: testResult.errors || null,
          entry: testResult.data?.save_article_articleExternal_Entry || null
        },
        availableMutations: {
          all: mutations.map(f => f.name).slice(0, 50), // Limit output
          articleSpecific: articleMutations.map(f => ({
            name: f.name,
            args: f.args?.map(arg => `${arg.name}: ${arg.type.name || arg.type.kind}`)
          }))
        },
        recommendations: {
          message: "Look for the correct mutation name for your article section",
          expectedFormat: "save_<sectionHandle>_<entryTypeHandle>_Entry",
          currentTarget: "save_articleExternal_default_Entry"
        }
      });

    } catch (error) {
      craftTestLogger.error('Craft CMS discovery failed', { 
        error: error.message,
        stack: error.stack
      });

      return jsonResponse({
        success: false,
        error: error.message,
        stack: error.stack
      }, 500);
    }
  }
}; 