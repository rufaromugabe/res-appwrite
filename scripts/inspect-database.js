// Script to inspect Appwrite database schema
import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env.local');
  dotenv.config({ path: envPath });
}

const client = new Client();
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'res-app-db';

async function inspectDatabase() {
  try {
    console.log('Inspecting database schema...');
    console.log('Database ID:', DATABASE_ID);
    console.log('');

    // List all collections
    const { collections } = await databases.listCollections(DATABASE_ID);
    
    console.log(`Found ${collections.length} collections:`);
    console.log('');

    for (const collection of collections) {
      console.log(`📁 Collection: ${collection.name} (ID: ${collection.$id})`);
      
      try {
        // Get collection details including attributes
        const collectionDetails = await databases.getCollection(DATABASE_ID, collection.$id);
        
        if (collectionDetails.attributes && collectionDetails.attributes.length > 0) {
          console.log('   Attributes:');
          collectionDetails.attributes.forEach(attr => {
            console.log(`   - ${attr.key}: ${attr.type}${attr.array ? '[]' : ''} (required: ${attr.required})`);
            if (attr.type === 'string' && attr.size) {
              console.log(`     Size: ${attr.size}`);
            }
            if (attr.type === 'enum' && attr.elements) {
              console.log(`     Options: [${attr.elements.join(', ')}]`);
            }
          });
        } else {
          console.log('   No attributes found');
        }
        
        console.log('   Permissions:', collectionDetails.permissions);
        console.log('');
      } catch (error) {
        console.error(`   Error getting details for ${collection.name}:`, error.message);
        console.log('');
      }
    }
  } catch (error) {
    console.error('Error inspecting database:', error);
  }
}

// Run the inspection
inspectDatabase()
  .then(() => {
    console.log('Database inspection completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database inspection failed:', error);
    process.exit(1);
  });
