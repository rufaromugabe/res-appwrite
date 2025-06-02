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
 * Update collection permissions
 */
async function updateCollectionPermissions(collectionId, name) {
  try {
    console.log(`Updating permissions for ${name} collection...`);
    
    // Define permissions based on collection type
    let permissions = [
      Permission.read(Role.any()), // Anyone can read
      Permission.write(Role.users("verified")), // Verified users can write
      Permission.update(Role.users("verified")), // Verified users can update
      Permission.delete(Role.team("admin")) // Only admins can delete
    ];
    
    // Settings and Hostels collections should have more restrictive permissions
    if (name === 'Settings' || name === 'Hostels') {
      permissions = [
        Permission.read(Role.any()), // Anyone can read
        Permission.write(Role.team("admin")), // Only admins can write
        Permission.update(Role.team("admin")), // Only admins can update
        Permission.delete(Role.team("admin")) // Only admins can delete
      ];
    }
    
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
 * Fix permission for hostels collection to allow student initialization
 */
async function temporarilyFixHostelsPermission() {
  try {
    console.log('Temporarily updating hostels collection permissions to allow initialization...');
    
    // Get collection ID
    const { collections } = await databases.listCollections(DATABASE_ID);
    const hostelsCollection = collections.find(c => c.$id === collections.HOSTELS || c.name.toLowerCase() === 'hostels');
    
    if (!hostelsCollection) {
      console.error('Hostels collection not found');
      return false;
    }
    
  // Update with more permissive permissions temporarily
    await databases.updateCollection(
      DATABASE_ID,
      hostelsCollection.$id,
      hostelsCollection.name,
      [
        Permission.read(Role.any()),
        Permission.write(Role.any()), // Allow anyone to write temporarily
        Permission.update(Role.users("verified")),
        Permission.delete(Role.team("admin"))
      ]
    );
    
    console.log('✅ Successfully updated hostels collection permissions temporarily');
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
 * Create admin team if it doesn't exist
 */
async function setupAdminTeam() {
  try {
    console.log('Setting up admin team...');
    
    // Check if admin team exists
    let adminTeam;
    try {
      const { teams: teamsList } = await teams.list();
      adminTeam = teamsList.find(team => team.name.toLowerCase() === 'admin');
      
      if (adminTeam) {
        console.log(`Admin team already exists with ID: ${adminTeam.$id}`);
      }
    } catch (error) {
      console.log('Error checking for existing teams:', error);
    }
    
    // Create admin team if it doesn't exist
    if (!adminTeam) {
      console.log('Creating admin team...');
      adminTeam = await teams.create(ID.unique(), 'Admin', []);
      console.log(`✅ Admin team created with ID: ${adminTeam.$id}`);
    }
    
    // Prompt for admin users
    console.log('');
    console.log('==========================================================');
    console.log('IMPORTANT: After this script completes:');
    console.log('1. Go to your Appwrite console');
    console.log('2. Navigate to Auth > Teams');
    console.log('3. Add admin users to the "Admin" team');
    console.log('==========================================================');
    console.log('');
    
    return adminTeam.$id;
  } catch (error) {
    console.error('❌ Error setting up admin team:', error);
    return null;
  }
}

// Main execution sequence
async function main() {
  try {
    // First setup the admin team
    await setupAdminTeam();
    
    // Then update all collection permissions
    await updateAllPermissions();
    
    console.log('');
    console.log('==========================================================');
    console.log('NEXT STEPS:');
    console.log('1. Go to Appwrite Console > Auth > Teams');
    console.log('2. Add your admin users to the "Admin" team');
    console.log('3. Any user in the Admin team will now have admin permissions');
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
