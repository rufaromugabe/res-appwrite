// Complete Appwrite Database Setup and Management Script
// This script combines all database operations: creation, inspection, fixing, and permissions
import { Client, Databases, Permission, Role } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env.local');
  dotenv.config({ path: envPath });
}

console.log('Appwrite endpoint:', process.env.APPWRITE_ENDPOINT);
console.log('Appwrite project ID:', process.env.APPWRITE_PROJECT_ID);
console.log('Appwrite database ID:', process.env.APPWRITE_DATABASE_ID);

const client = new Client();
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY); // Server API key needed for collection creation

const databases = new Databases(client);
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

// Collection schema definitions
const collectionSchemas = {
  users: [
    { key: 'displayName', type: 'string', size: 255, required: false },
    { key: 'email', type: 'email', required: true },
    { key: 'role', type: 'enum', elements: ['user', 'admin'], required: true },
    { key: 'createdAt', type: 'datetime', required: true },
    { key: 'lastLoginAt', type: 'datetime', required: false }
  ],
  students: [
    { key: 'regNumber', type: 'string', size: 50, required: true },
    { key: 'name', type: 'string', size: 255, required: true },
    { key: 'gender', type: 'enum', elements: ['Male', 'Female'], required: true },
    { key: 'programme', type: 'string', size: 255, required: true },
    { key: 'part', type: 'integer', required: true, min: 1, max: 6 },
    { key: 'email', type: 'email', required: true },
    { key: 'phone', type: 'string', size: 20, required: false },
    { key: 'userId', type: 'string', size: 255, required: false },
    { key: 'createdAt', type: 'datetime', required: true }
  ],
  applications: [
    { key: 'regNumber', type: 'string', size: 50, required: true },
    { key: 'preferredHostel', type: 'string', size: 255, required: false },
    { key: 'status', type: 'enum', elements: ['Pending', 'Accepted', 'Archived'], required: true },
    { key: 'paymentStatus', type: 'string', size: 50, required: false, default: 'Not Paid' },
    { key: 'reference', type: 'string', size: 255, required: false },
    { key: 'submittedAt', type: 'datetime', required: true },
    { key: 'userId', type: 'string', size: 255, required: false }
  ],
  hostels: [
    { key: 'name', type: 'string', size: 255, required: true },
    { key: 'description', type: 'string', size: 1000, required: false },
    { key: 'totalCapacity', type: 'integer', required: true },
    { key: 'currentOccupancy', type: 'integer', required: true },
    { key: 'gender', type: 'enum', elements: ['Male', 'Female', 'Mixed'], required: true },
    { key: 'isActive', type: 'boolean', required: true },
    { key: 'pricePerSemester', type: 'float', required: true },
    { key: 'features', type: 'string', size: 2000, required: false },
    { key: 'images', type: 'string', size: 2000, required: false },
    { key: 'floors', type: 'string', size: 16777216, required: false },
    { key: 'createdAt', type: 'datetime', required: true }
  ],
  rooms: [
    { key: 'number', type: 'string', size: 50, required: true },
    { key: 'floor', type: 'string', size: 100, required: true },
    { key: 'floorName', type: 'string', size: 100, required: true },
    { key: 'hostelId', type: 'string', size: 50, required: true },
    { key: 'hostelName', type: 'string', size: 255, required: true },
    { key: 'capacity', type: 'integer', required: true, min: 1, max: 10 },
    { key: 'occupants', type: 'string', size: 2000, required: false },
    { key: 'gender', type: 'enum', elements: ['Male', 'Female', 'Mixed'], required: true },
    { key: 'isReserved', type: 'boolean', required: false, default: false },
    { key: 'reservedBy', type: 'string', size: 255, required: false },
    { key: 'reservedUntil', type: 'datetime', required: false },
    { key: 'isAvailable', type: 'boolean', required: false, default: true },
    { key: 'features', type: 'string', size: 1000, required: false },
    { key: 'price', type: 'float', required: true, min: 0 },
    { key: 'paymentDeadline', type: 'datetime', required: false }
  ],
  payments: [
    { key: 'studentRegNumber', type: 'string', size: 50, required: true },
    { key: 'allocationId', type: 'string', size: 50, required: true },
    { key: 'receiptNumber', type: 'string', size: 100, required: true },
    { key: 'amount', type: 'float', required: true, min: 0 },
    { key: 'paymentMethod', type: 'enum', elements: ['Bank Transfer', 'Mobile Money', 'Cash', 'Card', 'Other'], required: true },
    { key: 'submittedAt', type: 'datetime', required: true },
    { key: 'status', type: 'enum', elements: ['Pending', 'Approved', 'Rejected'], required: true },
    { key: 'approvedBy', type: 'string', size: 255, required: false },
    { key: 'approvedAt', type: 'datetime', required: false },
    { key: 'rejectionReason', type: 'string', size: 500, required: false },
    { key: 'attachments', type: 'string', size: 2000, required: false },
    { key: 'notes', type: 'string', size: 1000, required: false },
    { key: 'userId', type: 'string', size: 255, required: false }
  ],
  roomAllocations: [
    { key: 'studentRegNumber', type: 'string', size: 50, required: true },
    { key: 'roomId', type: 'string', size: 50, required: true },
    { key: 'hostelId', type: 'string', size: 50, required: true },
    { key: 'allocatedAt', type: 'datetime', required: true },
    { key: 'paymentStatus', type: 'enum', elements: ['Pending', 'Paid', 'Overdue'], required: true },
    { key: 'paymentDeadline', type: 'datetime', required: true },
    { key: 'semester', type: 'string', size: 50, required: true },
    { key: 'academicYear', type: 'string', size: 20, required: true },
    { key: 'paymentId', type: 'string', size: 50, required: false },
    { key: 'userId', type: 'string', size: 255, required: false }
  ],
  settings: [
    { key: 'paymentGracePeriod', type: 'integer', required: false, min: 0, max: 168, default: 24 },
    { key: 'autoRevokeUnpaidAllocations', type: 'boolean', required: false, default: true },
    { key: 'maxRoomCapacity', type: 'integer', required: false, min: 1, max: 10, default: 4 },
    { key: 'allowMixedGender', type: 'boolean', required: false, default: false },
    { key: 'updatedAt', type: 'datetime', required: true },
    { key: 'updatedBy', type: 'string', size: 255, required: false }
  ]
};

// Index definitions for collections
const collectionIndexes = {
  students: [
    { name: 'regNumber_idx', type: 'key', attributes: ['regNumber'] },
    { name: 'userId_idx', type: 'key', attributes: ['userId'] }
  ],
  applications: [
    { name: 'regNumber_idx', type: 'key', attributes: ['regNumber'] },
    { name: 'status_idx', type: 'key', attributes: ['status'] },
    { name: 'userId_idx', type: 'key', attributes: ['userId'] }
  ],
  rooms: [
    { name: 'hostelId_idx', type: 'key', attributes: ['hostelId'] },
    { name: 'available_idx', type: 'key', attributes: ['isAvailable'] },
    { name: 'gender_idx', type: 'key', attributes: ['gender'] }
  ],
  payments: [
    { name: 'studentReg_idx', type: 'key', attributes: ['studentRegNumber'] },
    { name: 'status_idx', type: 'key', attributes: ['status'] },
    { name: 'allocation_idx', type: 'key', attributes: ['allocationId'] }
  ],
  roomAllocations: [
    { name: 'studentReg_idx', type: 'key', attributes: ['studentRegNumber'] },
    { name: 'room_idx', type: 'key', attributes: ['roomId'] },
    { name: 'paymentStatus_idx', type: 'key', attributes: ['paymentStatus'] },
    { name: 'deadline_idx', type: 'key', attributes: ['paymentDeadline'] }
  ]
};

// Utility functions
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createAttribute(collectionId, attr) {
  try {
    switch (attr.type) {
      case 'string':
        await databases.createStringAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.size,
          attr.required,
          attr.default || undefined
        );
        break;
      case 'email':
        await databases.createEmailAttribute(DATABASE_ID, collectionId, attr.key, attr.required);
        break;
      case 'enum':
        await databases.createEnumAttribute(DATABASE_ID, collectionId, attr.key, attr.elements, attr.required);
        break;
      case 'datetime':
        await databases.createDatetimeAttribute(DATABASE_ID, collectionId, attr.key, attr.required);
        break;
      case 'integer':
        await databases.createIntegerAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.required,
          attr.min || undefined,
          attr.max || undefined,
          attr.default || undefined
        );
        break;
      case 'float':
        await databases.createFloatAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.required,
          attr.min || undefined,
          attr.max || undefined,
          attr.default || undefined
        );
        break;
      case 'boolean':
        await databases.createBooleanAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.required,
          attr.default || undefined
        );
        break;
      default:
        console.warn(`Unknown attribute type: ${attr.type}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Error creating ${attr.key} attribute:`, error.message);
    return false;
  }
}

// Main database operations
async function inspectDatabase() {
  console.log('\n🔍 INSPECTING DATABASE');
  console.log('='.repeat(50));
  
  try {
    const { collections: dbCollections } = await databases.listCollections(DATABASE_ID);
    
    console.log(`Database ID: ${DATABASE_ID}`);
    console.log(`Found ${dbCollections.length} collections:\n`);

    for (const collection of dbCollections) {
      console.log(`📁 Collection: ${collection.name} (ID: ${collection.$id})`);
      
      try {
        const collectionDetails = await databases.getCollection(DATABASE_ID, collection.$id);
        
        if (collectionDetails.attributes && collectionDetails.attributes.length > 0) {
          console.log('   Attributes:');
          collectionDetails.attributes.forEach(attr => {
            let details = `${attr.type}${attr.array ? '[]' : ''} (required: ${attr.required})`;
            if (attr.type === 'string' && attr.size) {
              details += ` [size: ${attr.size}]`;
            }
            if (attr.type === 'enum' && attr.elements) {
              details += ` [options: ${attr.elements.join(', ')}]`;
            }
            if (attr.default !== undefined) {
              details += ` [default: ${attr.default}]`;
            }
            console.log(`   - ${attr.key}: ${details}`);
          });
        } else {
          console.log('   No attributes found');
        }
        
        console.log(`   Permissions: ${collectionDetails.permissions ? collectionDetails.permissions.length : 0} rules`);
        console.log('');
      } catch (error) {
        console.error(`   Error getting details: ${error.message}\n`);
      }
    }
  } catch (error) {
    console.error('❌ Error inspecting database:', error);
  }
}

async function createCollectionWithAttributes(collectionId, collectionName, schema, indexes = []) {
  try {
    // Create collection
    await databases.createCollection(
      DATABASE_ID,
      collectionId,
      collectionName,
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );
    
    console.log(`✅ Created collection: ${collectionName}`);
    
    // Add attributes
    for (const attr of schema) {
      const success = await createAttribute(collectionId, attr);
      if (success) {
        console.log(`   ✅ Added attribute: ${attr.key}`);
      }
      await sleep(500); // Prevent rate limiting
    }
    
    // Create indexes
    for (const index of indexes) {
      try {
        await databases.createIndex(DATABASE_ID, collectionId, index.name, index.type, index.attributes);
        console.log(`   ✅ Created index: ${index.name}`);
        await sleep(500);
      } catch (error) {
        console.error(`   ❌ Error creating index ${index.name}:`, error.message);
      }
    }
    
    return true;
  } catch (error) {
    if (error.code === 409) {
      console.log(`ℹ️ Collection ${collectionName} already exists`);
      return false;
    } else {
      console.error(`❌ Error creating collection ${collectionName}:`, error);
      return false;
    }
  }
}

async function fixMissingAttributes(collectionId, schema) {
  try {
    const collection = await databases.getCollection(DATABASE_ID, collectionId);
    const existingAttributes = collection.attributes.map(attr => attr.key);
    
    console.log(`🔧 Checking ${collection.name} collection for missing attributes...`);
    
    let addedCount = 0;
    for (const attr of schema) {
      if (!existingAttributes.includes(attr.key)) {
        console.log(`   Adding missing attribute: ${attr.key}`);
        const success = await createAttribute(collectionId, attr);
        if (success) {
          console.log(`   ✅ Added ${attr.key}`);
          addedCount++;
        }
        await sleep(1000); // Longer delay for existing collections
      } else {
        console.log(`   ✓ ${attr.key} already exists`);
      }
    }
    
    if (addedCount > 0) {
      console.log(`✅ Added ${addedCount} missing attributes to ${collection.name}`);
    } else {
      console.log(`✅ No missing attributes in ${collection.name}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error fixing attributes for ${collectionId}:`, error);
    return false;
  }
}

async function updateCollectionPermissions(collectionId, collectionName) {
  try {
    const permissions = [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ];
    
    await databases.updateCollection(DATABASE_ID, collectionId, collectionName, permissions);
    console.log(`✅ Updated permissions for ${collectionName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating permissions for ${collectionName}:`, error);
    return false;
  }
}

async function createAllCollections() {
  console.log('\n🏗️ CREATING COLLECTIONS');
  console.log('='.repeat(50));
  
  const collectionsToCreate = [
    { id: collections.USERS, name: 'Users', schema: collectionSchemas.users },
    { id: collections.STUDENTS, name: 'Students', schema: collectionSchemas.students, indexes: collectionIndexes.students },
    { id: collections.APPLICATIONS, name: 'Applications', schema: collectionSchemas.applications, indexes: collectionIndexes.applications },
    { id: collections.HOSTELS, name: 'Hostels', schema: collectionSchemas.hostels },
    { id: collections.ROOMS, name: 'Rooms', schema: collectionSchemas.rooms, indexes: collectionIndexes.rooms },
    { id: collections.PAYMENTS, name: 'Payments', schema: collectionSchemas.payments, indexes: collectionIndexes.payments },
    { id: collections.ROOM_ALLOCATIONS, name: 'Room Allocations', schema: collectionSchemas.roomAllocations, indexes: collectionIndexes.roomAllocations },
    { id: collections.SETTINGS, name: 'Settings', schema: collectionSchemas.settings }
  ];
  
  for (const collection of collectionsToCreate) {
    await createCollectionWithAttributes(
      collection.id,
      collection.name,
      collection.schema,
      collection.indexes || []
    );
    await sleep(1000);
  }
}

async function fixAllCollections() {
  console.log('\n🔧 FIXING MISSING ATTRIBUTES');
  console.log('='.repeat(50));
  
  try {
    const { collections: dbCollections } = await databases.listCollections(DATABASE_ID);
    
    for (const dbCollection of dbCollections) {
      const collectionId = dbCollection.$id;
      const schema = collectionSchemas[collectionId];
      
      if (schema) {
        await fixMissingAttributes(collectionId, schema);
      } else {
        console.log(`⚠️ No schema found for collection: ${collectionId}`);
      }
    }
  } catch (error) {
    console.error('❌ Error fixing collections:', error);
  }
}

async function updateAllPermissions() {
  console.log('\n🔐 UPDATING PERMISSIONS');
  console.log('='.repeat(50));
  
  try {
    const { collections: dbCollections } = await databases.listCollections(DATABASE_ID);
    
    for (const collection of dbCollections) {
      await updateCollectionPermissions(collection.$id, collection.name);
    }
    
    console.log('\n📋 PERMISSION SUMMARY:');
    console.log('- All authenticated users can read, create, update, and delete');
    console.log('- Role-based restrictions should be handled in application logic');
    console.log('- Check user.role in your app code for admin/user access control');
  } catch (error) {
    console.error('❌ Error updating permissions:', error);
  }
}

// Main execution function
async function main() {
  console.log('🚀 COMPLETE APPWRITE DATABASE SETUP');
  console.log('='.repeat(60));
  console.log(`Using database: ${DATABASE_ID}`);
  
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'full';
    
    switch (command) {
      case 'inspect':
        await inspectDatabase();
        break;
        
      case 'create':
        await createAllCollections();
        break;
        
      case 'fix':
        await fixAllCollections();
        break;
        
      case 'permissions':
        await updateAllPermissions();
        break;
        
      case 'full':
      default:
        console.log('Running complete database setup...\n');
        
        // 1. Inspect current state
        await inspectDatabase();
        
        // 2. Create collections (will skip existing ones)
        await createAllCollections();
        
        // 3. Fix any missing attributes
        await fixAllCollections();
        
        // 4. Update permissions
        await updateAllPermissions();
        
        // 5. Final inspection
        console.log('\n🎯 FINAL DATABASE STATE');
        console.log('='.repeat(50));
        await inspectDatabase();
        break;
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nAvailable commands:');
    console.log('  node complete-database-setup.js full        - Run complete setup');
    console.log('  node complete-database-setup.js inspect     - Inspect database only');
    console.log('  node complete-database-setup.js create      - Create collections only');
    console.log('  node complete-database-setup.js fix         - Fix missing attributes only');
    console.log('  node complete-database-setup.js permissions - Update permissions only');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => {
    console.log('\nProcess completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Process failed:', error);
    process.exit(1);
  });
