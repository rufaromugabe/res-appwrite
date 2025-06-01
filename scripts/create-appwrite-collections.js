// Script to create Appwrite collections and attributes
import { Client, Databases, Permission, Role } from 'node-appwrite';

const client = new Client();
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
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
  STUDENTS: 'students' // Added for student profiles
};

async function createCollections() {
  try {
    // Create database first
    try {
      await databases.create(DATABASE_ID, 'Residence Application Database');
      console.log('✅ Database created successfully');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️ Database already exists');
      } else {
        throw error;
      }
    }

    // 1. Users Collection
    await createUsersCollection();
    
    // 2. Students Collection
    await createStudentsCollection();
    
    // 3. Applications Collection
    await createApplicationsCollection();
    
    // 4. Hostels Collection
    await createHostelsCollection();
    
    // 5. Rooms Collection
    await createRoomsCollection();
    
    // 6. Payments Collection
    await createPaymentsCollection();
    
    // 7. Room Allocations Collection
    await createRoomAllocationsCollection();
    
    // 8. Settings Collection
    await createSettingsCollection();

    console.log('🎉 All collections created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating collections:', error);
  }
}

async function createUsersCollection() {
  try {
    await databases.createCollection(
      DATABASE_ID,
      collections.USERS,
      'Users',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.user('[USER_ID]')),
        Permission.delete(Role.user('[USER_ID]'))
      ]
    );
    
    // Add attributes
    await databases.createStringAttribute(DATABASE_ID, collections.USERS, 'displayName', 255, false);
    await databases.createEmailAttribute(DATABASE_ID, collections.USERS, 'email', true);
    await databases.createEnumAttribute(DATABASE_ID, collections.USERS, 'role', ['user', 'admin'], true, 'user');
    await databases.createDatetimeAttribute(DATABASE_ID, collections.USERS, 'createdAt', true);
    await databases.createDatetimeAttribute(DATABASE_ID, collections.USERS, 'lastLoginAt', false);
    
    console.log('✅ Users collection created');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️ Users collection already exists');
    } else {
      throw error;
    }
  }
}

async function createStudentsCollection() {
  try {
    await databases.createCollection(
      DATABASE_ID,
      collections.STUDENTS,
      'Students',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.user('[USER_ID]')),
        Permission.delete(Role.team('admins'))
      ]
    );
    
    // Add attributes
    await databases.createStringAttribute(DATABASE_ID, collections.STUDENTS, 'regNumber', 50, true);
    await databases.createStringAttribute(DATABASE_ID, collections.STUDENTS, 'name', 255, true);
    await databases.createEnumAttribute(DATABASE_ID, collections.STUDENTS, 'gender', ['Male', 'Female'], true);
    await databases.createStringAttribute(DATABASE_ID, collections.STUDENTS, 'programme', 255, true);
    await databases.createIntegerAttribute(DATABASE_ID, collections.STUDENTS, 'part', true, 1, 6);
    await databases.createEmailAttribute(DATABASE_ID, collections.STUDENTS, 'email', true);
    await databases.createStringAttribute(DATABASE_ID, collections.STUDENTS, 'phone', 20, false);
    await databases.createStringAttribute(DATABASE_ID, collections.STUDENTS, 'userId', 255, false); // Link to auth user
    await databases.createDatetimeAttribute(DATABASE_ID, collections.STUDENTS, 'createdAt', true);
    
    // Create indexes
    await databases.createIndex(DATABASE_ID, collections.STUDENTS, 'regNumber_idx', 'key', ['regNumber']);
    await databases.createIndex(DATABASE_ID, collections.STUDENTS, 'userId_idx', 'key', ['userId']);
    
    console.log('✅ Students collection created');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️ Students collection already exists');
    } else {
      throw error;
    }
  }
}

async function createApplicationsCollection() {
  try {
    await databases.createCollection(
      DATABASE_ID,
      collections.APPLICATIONS,
      'Applications',
      [
        Permission.read(Role.team('admins')),
        Permission.read(Role.user('[USER_ID]')),
        Permission.create(Role.users()),
        Permission.update(Role.team('admins')),
        Permission.update(Role.user('[USER_ID]'))
      ]
    );
    
    // Add attributes
    await databases.createStringAttribute(DATABASE_ID, collections.APPLICATIONS, 'regNumber', 50, true);
    await databases.createStringAttribute(DATABASE_ID, collections.APPLICATIONS, 'preferredHostel', 255, false);
    await databases.createEnumAttribute(DATABASE_ID, collections.APPLICATIONS, 'status', ['Pending', 'Accepted', 'Archived'], true, 'Pending');
    await databases.createStringAttribute(DATABASE_ID, collections.APPLICATIONS, 'paymentStatus', 50, false, 'Not Paid');
    await databases.createStringAttribute(DATABASE_ID, collections.APPLICATIONS, 'reference', 255, false);
    await databases.createDatetimeAttribute(DATABASE_ID, collections.APPLICATIONS, 'submittedAt', true);
    await databases.createStringAttribute(DATABASE_ID, collections.APPLICATIONS, 'userId', 255, false); // Link to auth user
    
    // Create indexes
    await databases.createIndex(DATABASE_ID, collections.APPLICATIONS, 'regNumber_idx', 'key', ['regNumber']);
    await databases.createIndex(DATABASE_ID, collections.APPLICATIONS, 'status_idx', 'key', ['status']);
    await databases.createIndex(DATABASE_ID, collections.APPLICATIONS, 'userId_idx', 'key', ['userId']);
    
    console.log('✅ Applications collection created');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️ Applications collection already exists');
    } else {
      throw error;
    }
  }
}

async function createHostelsCollection() {
  try {
    await databases.createCollection(
      DATABASE_ID,
      collections.HOSTELS,
      'Hostels',
      [
        Permission.read(Role.any()),
        Permission.create(Role.team('admins')),
        Permission.update(Role.team('admins')),
        Permission.delete(Role.team('admins'))
      ]
    );
    
    // Add attributes
    await databases.createStringAttribute(DATABASE_ID, collections.HOSTELS, 'name', 255, true);
    await databases.createStringAttribute(DATABASE_ID, collections.HOSTELS, 'description', 1000, false);
    await databases.createIntegerAttribute(DATABASE_ID, collections.HOSTELS, 'totalCapacity', true, 0);
    await databases.createIntegerAttribute(DATABASE_ID, collections.HOSTELS, 'currentOccupancy', true, 0, undefined, 0);
    await databases.createEnumAttribute(DATABASE_ID, collections.HOSTELS, 'gender', ['Male', 'Female', 'Mixed'], true);
    await databases.createBooleanAttribute(DATABASE_ID, collections.HOSTELS, 'isActive', true, true);
    await databases.createFloatAttribute(DATABASE_ID, collections.HOSTELS, 'pricePerSemester', true, 0);
    await databases.createStringAttribute(DATABASE_ID, collections.HOSTELS, 'features', 2000, false); // JSON string
    await databases.createStringAttribute(DATABASE_ID, collections.HOSTELS, 'images', 2000, false); // JSON string
    await databases.createDatetimeAttribute(DATABASE_ID, collections.HOSTELS, 'createdAt', true);
    
    console.log('✅ Hostels collection created');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️ Hostels collection already exists');
    } else {
      throw error;
    }
  }
}

async function createRoomsCollection() {
  try {
    await databases.createCollection(
      DATABASE_ID,
      collections.ROOMS,
      'Rooms',
      [
        Permission.read(Role.any()),
        Permission.create(Role.team('admins')),
        Permission.update(Role.team('admins')),
        Permission.delete(Role.team('admins'))
      ]
    );
    
    // Add attributes
    await databases.createStringAttribute(DATABASE_ID, collections.ROOMS, 'number', 50, true);
    await databases.createStringAttribute(DATABASE_ID, collections.ROOMS, 'floor', 100, true);
    await databases.createStringAttribute(DATABASE_ID, collections.ROOMS, 'floorName', 100, true);
    await databases.createStringAttribute(DATABASE_ID, collections.ROOMS, 'hostelId', 50, true);
    await databases.createStringAttribute(DATABASE_ID, collections.ROOMS, 'hostelName', 255, true);
    await databases.createIntegerAttribute(DATABASE_ID, collections.ROOMS, 'capacity', true, 1, 10);
    await databases.createStringAttribute(DATABASE_ID, collections.ROOMS, 'occupants', 2000, false); // JSON string array
    await databases.createEnumAttribute(DATABASE_ID, collections.ROOMS, 'gender', ['Male', 'Female', 'Mixed'], true);
    await databases.createBooleanAttribute(DATABASE_ID, collections.ROOMS, 'isReserved', true, false);
    await databases.createStringAttribute(DATABASE_ID, collections.ROOMS, 'reservedBy', 255, false);
    await databases.createDatetimeAttribute(DATABASE_ID, collections.ROOMS, 'reservedUntil', false);
    await databases.createBooleanAttribute(DATABASE_ID, collections.ROOMS, 'isAvailable', true, true);
    await databases.createStringAttribute(DATABASE_ID, collections.ROOMS, 'features', 1000, false); // JSON string
    await databases.createFloatAttribute(DATABASE_ID, collections.ROOMS, 'price', true, 0);
    await databases.createDatetimeAttribute(DATABASE_ID, collections.ROOMS, 'paymentDeadline', false);
    
    // Create indexes
    await databases.createIndex(DATABASE_ID, collections.ROOMS, 'hostelId_idx', 'key', ['hostelId']);
    await databases.createIndex(DATABASE_ID, collections.ROOMS, 'available_idx', 'key', ['isAvailable']);
    await databases.createIndex(DATABASE_ID, collections.ROOMS, 'gender_idx', 'key', ['gender']);
    
    console.log('✅ Rooms collection created');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️ Rooms collection already exists');
    } else {
      throw error;
    }
  }
}

async function createPaymentsCollection() {
  try {
    await databases.createCollection(
      DATABASE_ID,
      collections.PAYMENTS,
      'Payments',
      [
        Permission.read(Role.team('admins')),
        Permission.read(Role.user('[USER_ID]')),
        Permission.create(Role.users()),
        Permission.update(Role.team('admins'))
      ]
    );
    
    // Add attributes
    await databases.createStringAttribute(DATABASE_ID, collections.PAYMENTS, 'studentRegNumber', 50, true);
    await databases.createStringAttribute(DATABASE_ID, collections.PAYMENTS, 'allocationId', 50, true);
    await databases.createStringAttribute(DATABASE_ID, collections.PAYMENTS, 'receiptNumber', 100, true);
    await databases.createFloatAttribute(DATABASE_ID, collections.PAYMENTS, 'amount', true, 0);
    await databases.createEnumAttribute(DATABASE_ID, collections.PAYMENTS, 'paymentMethod', ['Bank Transfer', 'Mobile Money', 'Cash', 'Card', 'Other'], true);
    await databases.createDatetimeAttribute(DATABASE_ID, collections.PAYMENTS, 'submittedAt', true);
    await databases.createEnumAttribute(DATABASE_ID, collections.PAYMENTS, 'status', ['Pending', 'Approved', 'Rejected'], true, 'Pending');
    await databases.createStringAttribute(DATABASE_ID, collections.PAYMENTS, 'approvedBy', 255, false);
    await databases.createDatetimeAttribute(DATABASE_ID, collections.PAYMENTS, 'approvedAt', false);
    await databases.createStringAttribute(DATABASE_ID, collections.PAYMENTS, 'rejectionReason', 500, false);
    await databases.createStringAttribute(DATABASE_ID, collections.PAYMENTS, 'attachments', 2000, false); // JSON string
    await databases.createStringAttribute(DATABASE_ID, collections.PAYMENTS, 'notes', 1000, false);
    await databases.createStringAttribute(DATABASE_ID, collections.PAYMENTS, 'userId', 255, false); // Link to auth user
    
    // Create indexes
    await databases.createIndex(DATABASE_ID, collections.PAYMENTS, 'studentReg_idx', 'key', ['studentRegNumber']);
    await databases.createIndex(DATABASE_ID, collections.PAYMENTS, 'status_idx', 'key', ['status']);
    await databases.createIndex(DATABASE_ID, collections.PAYMENTS, 'allocation_idx', 'key', ['allocationId']);
    
    console.log('✅ Payments collection created');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️ Payments collection already exists');
    } else {
      throw error;
    }
  }
}

async function createRoomAllocationsCollection() {
  try {
    await databases.createCollection(
      DATABASE_ID,
      collections.ROOM_ALLOCATIONS,
      'Room Allocations',
      [
        Permission.read(Role.team('admins')),
        Permission.read(Role.user('[USER_ID]')),
        Permission.create(Role.users()),
        Permission.update(Role.team('admins')),
        Permission.delete(Role.team('admins'))
      ]
    );
    
    // Add attributes
    await databases.createStringAttribute(DATABASE_ID, collections.ROOM_ALLOCATIONS, 'studentRegNumber', 50, true);
    await databases.createStringAttribute(DATABASE_ID, collections.ROOM_ALLOCATIONS, 'roomId', 50, true);
    await databases.createStringAttribute(DATABASE_ID, collections.ROOM_ALLOCATIONS, 'hostelId', 50, true);
    await databases.createDatetimeAttribute(DATABASE_ID, collections.ROOM_ALLOCATIONS, 'allocatedAt', true);
    await databases.createEnumAttribute(DATABASE_ID, collections.ROOM_ALLOCATIONS, 'paymentStatus', ['Pending', 'Paid', 'Overdue'], true, 'Pending');
    await databases.createDatetimeAttribute(DATABASE_ID, collections.ROOM_ALLOCATIONS, 'paymentDeadline', true);
    await databases.createStringAttribute(DATABASE_ID, collections.ROOM_ALLOCATIONS, 'semester', 50, true);
    await databases.createStringAttribute(DATABASE_ID, collections.ROOM_ALLOCATIONS, 'academicYear', 20, true);
    await databases.createStringAttribute(DATABASE_ID, collections.ROOM_ALLOCATIONS, 'paymentId', 50, false);
    await databases.createStringAttribute(DATABASE_ID, collections.ROOM_ALLOCATIONS, 'userId', 255, false); // Link to auth user
    
    // Create indexes
    await databases.createIndex(DATABASE_ID, collections.ROOM_ALLOCATIONS, 'studentReg_idx', 'key', ['studentRegNumber']);
    await databases.createIndex(DATABASE_ID, collections.ROOM_ALLOCATIONS, 'room_idx', 'key', ['roomId']);
    await databases.createIndex(DATABASE_ID, collections.ROOM_ALLOCATIONS, 'paymentStatus_idx', 'key', ['paymentStatus']);
    await databases.createIndex(DATABASE_ID, collections.ROOM_ALLOCATIONS, 'deadline_idx', 'key', ['paymentDeadline']);
    
    console.log('✅ Room Allocations collection created');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️ Room Allocations collection already exists');
    } else {
      throw error;
    }
  }
}

async function createSettingsCollection() {
  try {
    await databases.createCollection(
      DATABASE_ID,
      collections.SETTINGS,
      'Settings',
      [
        Permission.read(Role.any()),
        Permission.create(Role.team('admins')),
        Permission.update(Role.team('admins')),
        Permission.delete(Role.team('admins'))
      ]
    );
    
    // Add attributes
    await databases.createIntegerAttribute(DATABASE_ID, collections.SETTINGS, 'paymentGracePeriod', true, 0, 168, 24); // Hours
    await databases.createBooleanAttribute(DATABASE_ID, collections.SETTINGS, 'autoRevokeUnpaidAllocations', true, true);
    await databases.createIntegerAttribute(DATABASE_ID, collections.SETTINGS, 'maxRoomCapacity', true, 1, 10, 4);
    await databases.createBooleanAttribute(DATABASE_ID, collections.SETTINGS, 'allowMixedGender', true, false);
    await databases.createDatetimeAttribute(DATABASE_ID, collections.SETTINGS, 'updatedAt', true);
    await databases.createStringAttribute(DATABASE_ID, collections.SETTINGS, 'updatedBy', 255, false);
    
    console.log('✅ Settings collection created');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️ Settings collection already exists');
    } else {
      throw error;
    }
  }
}

// Execute the script
createCollections();
