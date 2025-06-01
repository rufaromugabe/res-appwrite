import { Client, Account, Databases, Storage, Functions, Query, Permission, Role, ID } from 'appwrite';

const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// Database and Collection IDs (you'll need to create these in Appwrite console)
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'res-app-db';

export const COLLECTION_IDS = {
  USERS: 'users',
  STUDENTS: 'students',
  APPLICATIONS: 'applications', 
  HOSTELS: 'hostels',
  ROOMS: 'rooms',
  PAYMENTS: 'payments',
  ROOM_ALLOCATIONS: 'roomAllocations',
  SETTINGS: 'settings'
} as const;

// Export utilities
export { Query, Permission, Role, ID };

export default client;
