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
  HOSTELS: 'hostels'
};

async function addMissingAttributesToHostels() {
  try {
    console.log('Checking and adding missing attributes to Hostels collection...');
    
    // Get current collection details
    const collection = await databases.getCollection(DATABASE_ID, collections.HOSTELS);
    const existingAttributes = collection.attributes.map(attr => attr.key);
    
    console.log('Existing attributes:', existingAttributes);
    
    // Define required attributes that might be missing
    const requiredAttributes = [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 1000, required: false },
      { key: 'totalCapacity', type: 'integer', required: true },
      { key: 'currentOccupancy', type: 'integer', required: true },
      { key: 'gender', type: 'enum', elements: ['Male', 'Female', 'Mixed'], required: true },
      { key: 'isActive', type: 'boolean', required: true },
      { key: 'pricePerSemester', type: 'float', required: true },
      { key: 'features', type: 'string', size: 2000, required: false },
      { key: 'images', type: 'string', size: 2000, required: false },
      { key: 'floors', type: 'string', size: 16777216, required: false }, // Large JSON string for floors data
      { key: 'createdAt', type: 'datetime', required: true }
    ];
    
    // Add missing attributes
    for (const attr of requiredAttributes) {
      if (!existingAttributes.includes(attr.key)) {
        console.log(`Adding missing attribute: ${attr.key}`);
        
        try {
          switch (attr.type) {
            case 'string':
              await databases.createStringAttribute(DATABASE_ID, collections.HOSTELS, attr.key, attr.size, attr.required);
              break;
            case 'integer':
              await databases.createIntegerAttribute(DATABASE_ID, collections.HOSTELS, attr.key, attr.required);
              break;
            case 'float':
              await databases.createFloatAttribute(DATABASE_ID, collections.HOSTELS, attr.key, attr.required);
              break;
            case 'boolean':
              await databases.createBooleanAttribute(DATABASE_ID, collections.HOSTELS, attr.key, attr.required);
              break;
            case 'enum':
              await databases.createEnumAttribute(DATABASE_ID, collections.HOSTELS, attr.key, attr.elements, attr.required);
              break;
            case 'datetime':
              await databases.createDatetimeAttribute(DATABASE_ID, collections.HOSTELS, attr.key, attr.required);
              break;
          }
          console.log(`✅ Added ${attr.key} attribute`);
          
          // Wait a bit between attribute creations to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Error adding ${attr.key} attribute:`, error.message);
        }
      } else {
        console.log(`✓ ${attr.key} attribute already exists`);
      }
    }
    
    console.log('✅ Hostels collection attributes check completed');
  } catch (error) {
    console.error('❌ Error checking Hostels collection:', error);
  }
}

async function fixHostelCollection() {
  try {
    console.log('Starting hostel collection attributes fix...');
    
    await addMissingAttributesToHostels();
    
    console.log('🎉 Hostel collection attributes fix completed!');
  } catch (error) {
    console.error('❌ Error fixing hostel collection attributes:', error);
  }
}

// Run the fix
fixHostelCollection()
  .then(() => {
    console.log('Hostel collection fix process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Hostel collection fix process failed:', error);
    process.exit(1);
  });
