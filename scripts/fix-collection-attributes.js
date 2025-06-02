// Script to add missing attributes to existing collections
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

const collections = {
  USERS: 'users',
  STUDENTS: 'students',
  APPLICATIONS: 'applications',
  HOSTELS: 'hostels',
  ROOMS: 'rooms',
  PAYMENTS: 'payments',
  ROOM_ALLOCATIONS: 'roomAllocations',
  SETTINGS: 'settings'
};

async function addMissingAttributesToUsers() {
  try {
    console.log('Checking and adding missing attributes to Users collection...');
    
    // Get current collection details
    const collection = await databases.getCollection(DATABASE_ID, collections.USERS);
    const existingAttributes = collection.attributes.map(attr => attr.key);
    
    console.log('Existing attributes:', existingAttributes);
    
    // Define required attributes
    const requiredAttributes = [
      { key: 'displayName', type: 'string', size: 255, required: false },
      { key: 'email', type: 'email', required: true },
      { key: 'role', type: 'enum', elements: ['user', 'admin'], required: true },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'lastLoginAt', type: 'datetime', required: false }
    ];
    
    // Add missing attributes
    for (const attr of requiredAttributes) {
      if (!existingAttributes.includes(attr.key)) {
        console.log(`Adding missing attribute: ${attr.key}`);
        
        try {
          switch (attr.type) {
            case 'string':
              await databases.createStringAttribute(DATABASE_ID, collections.USERS, attr.key, attr.size, attr.required);
              break;
            case 'email':
              await databases.createEmailAttribute(DATABASE_ID, collections.USERS, attr.key, attr.required);
              break;
            case 'enum':
              await databases.createEnumAttribute(DATABASE_ID, collections.USERS, attr.key, attr.elements, attr.required);
              break;
            case 'datetime':
              await databases.createDatetimeAttribute(DATABASE_ID, collections.USERS, attr.key, attr.required);
              break;
          }
          console.log(`✅ Added ${attr.key} attribute`);
        } catch (error) {
          console.error(`❌ Error adding ${attr.key} attribute:`, error.message);
        }
      } else {
        console.log(`✓ ${attr.key} attribute already exists`);
      }
    }
    
    console.log('✅ Users collection attributes check completed');
  } catch (error) {
    console.error('❌ Error checking Users collection:', error);
  }
}

async function fixAllCollections() {
  try {
    console.log('Starting collection attributes fix...');
    
    // First, fix the Users collection
    await addMissingAttributesToUsers();
    
    // You can add similar functions for other collections if needed
    
    console.log('🎉 Collection attributes fix completed!');
  } catch (error) {
    console.error('❌ Error fixing collection attributes:', error);
  }
}

// Run the fix
fixAllCollections()
  .then(() => {
    console.log('Collection fix process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Collection fix process failed:', error);
    process.exit(1);
  });
