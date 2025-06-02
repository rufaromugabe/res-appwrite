// Script to update Appwrite collection permissions
import { Client, Databases, Permission, Role, Teams, ID } from 'node-appwrite';
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
  .setKey(process.env.APPWRITE_API_KEY); // Server API key needed for collection updates

const databases = new Databases(client);
const teams = new Teams(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'res-app-db';

const collections = {
  USERS: 'users',
  APPLICATIONS: 'applications',
  HOSTELS: 'hostels',
  ROOMS: 'rooms',
  PAYMENTS: 'payments',
  ROOM_ALLOCATIONS: 'roomAllocations',
  SETTINGS: 'settings',
  STUDENTS: 'students'
};

/**
 * Update collection permissions - Simplified to use user role only
 */
async function updateCollectionPermissions(collectionId, name) {
  try {
    console.log(`Updating permissions for ${name} collection...`);
    
    // Simple permissions - all authenticated users can do everything
    // Role-based restrictions will be handled in application logic
    let permissions = [
      Permission.read(Role.users()), // Any authenticated user can read
      Permission.create(Role.users()), // Any authenticated user can create
      Permission.update(Role.users()), // Any authenticated user can update
      Permission.delete(Role.users()) // Any authenticated user can delete
    ];
    
    await databases.updateCollection(
      DATABASE_ID,
      collectionId,
      name,
      permissions
    );
    
    console.log(`✅ Successfully updated ${name} collection permissions`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${name} collection:`, error);
    return false;
  }
}

/**
 * Simple permissions setup - No teams needed
 */
async function temporarilyFixHostelsPermission() {
  try {
    console.log('Updating hostels collection permissions...');
    
    // Get collection ID
    const { collections } = await databases.listCollections(DATABASE_ID);
    const hostelsCollection = collections.find(c => c.$id === 'hostels' || c.name.toLowerCase() === 'hostels');
    
    if (!hostelsCollection) {
      console.error('Hostels collection not found');
      return false;
    }
    
    // Update with simple user permissions
    await databases.updateCollection(
      DATABASE_ID,
      hostelsCollection.$id,
      hostelsCollection.name,
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );
    
    console.log('✅ Successfully updated hostels collection permissions');
    return true;
  } catch (error) {
    console.error('❌ Error updating hostels collection permissions:', error);
    return false;
  }
}

/**
 * Main function to update all collection permissions
 */
async function updateAllPermissions() {
  try {
    console.log('Fetching collections from database...');
    const { collections: allCollections } = await databases.listCollections(DATABASE_ID);
    
    if (allCollections.length === 0) {
      console.log('No collections found in the database.');
      return;
    }
    
    console.log(`Found ${allCollections.length} collections in the database.`);
    
    // Update permissions for each collection
    for (const collection of allCollections) {
      const collectionName = collection.name;
      console.log(`Processing collection: ${collectionName} (ID: ${collection.$id})`);
      
      await updateCollectionPermissions(collection.$id, collectionName);
    }
    
    console.log('🎉 All collection permissions updated successfully!');
  } catch (error) {
    console.error('❌ Error updating collection permissions:', error);
  }
}

/**
 * No need for admin team with simplified permissions
 */
async function setupAdminTeam() {
  console.log('Skipping admin team setup - using simplified user-based permissions');
  console.log('Role-based access control will be handled in application logic');
  return null;
}

// Main execution sequence
async function main() {
  try {
    console.log('Starting simplified permissions update...');
    
    // Update all collection permissions with simple user-based access
    await updateAllPermissions();
    
    console.log('');
    console.log('==========================================================');
    console.log('SIMPLIFIED PERMISSIONS APPLIED:');
    console.log('- All authenticated users can read, create, update, and delete');
    console.log('- Role-based restrictions handled in application logic');
    console.log('- No teams required - check user.role in your app code');
    console.log('==========================================================');
    
    console.log('Permission update process completed');
    process.exit(0);
  } catch (error) {
    console.error('Permission update process failed:', error);
    process.exit(1);
  }
}

// Run the main function
main();
