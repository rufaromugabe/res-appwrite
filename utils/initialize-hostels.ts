import { createHostel, fetchHostels } from '../data/appwrite-hostel-data';
import { initialHostelData } from '../data/initial-hostel-data';

/**
 * Check if a hostel with the same name already exists
 * This provides additional safety against creating duplicate hostels
 */
const isHostelDuplicate = (existingHostels: any[], newHostelData: any): boolean => {
  return existingHostels.some(existing => 
    existing.name.toLowerCase().trim() === newHostelData.name.toLowerCase().trim()
  );
};

// Global flag to prevent concurrent initializations
let isInitializing = false;

/**
 * Check if hostels exist in Firebase and initialize them if they don't
 * This function should be called when the app starts up
 */
export const checkAndInitializeHostels = async (): Promise<boolean> => {
  try {
    // Prevent concurrent initializations
    if (isInitializing) {
      console.log('Hostel initialization already in progress, skipping...');
      return true;
    }

    isInitializing = true;
    console.log('Checking for existing hostels in Appwrite...');
    
    // Fetch existing hostels
    const existingHostels = await fetchHostels();
    
    if (existingHostels.length > 0) {
      console.log(`Found ${existingHostels.length} existing hostel(s). Checking for specific hostels...`);
        // Check if specific hostels from our initial data already exist
      const hostelsToCreate = initialHostelData.filter(
        hostelData => !isHostelDuplicate(existingHostels, hostelData)
      );
      
      if (hostelsToCreate.length === 0) {
        console.log('All initial hostels already exist. Skipping initialization.');
        isInitializing = false;
        return true;
      }
      
      console.log(`Found ${hostelsToCreate.length} new hostel(s) to create...`);
      
      // Create only the hostels that don't exist yet
      for (const hostelData of hostelsToCreate) {
        console.log(`Creating ${hostelData.name}...`);
        const hostelId = await createHostel(hostelData);
        console.log(`✅ Created ${hostelData.name} with ID: ${hostelId}`);
      }
      
      console.log('🎉 New hostel data initialization completed successfully!');
      isInitializing = false;
      return true;
    }
    
    console.log('No hostels found. Initializing all hostel data...');
    
    // Initialize all hostels if none exist
    for (const hostelData of initialHostelData) {
      console.log(`Creating ${hostelData.name}...`);
      const hostelId = await createHostel(hostelData);
      console.log(`✅ Created ${hostelData.name} with ID: ${hostelId}`);
    }
    
    console.log('🎉 Hostel data initialization completed successfully!');
    isInitializing = false;
    return true;
  } catch (error) {
    console.error('❌ Error checking/initializing hostel data:', error);
    isInitializing = false;
    return false;
  }
};

/**
 * Force initialize hostel data with duplicate prevention
 * This will only create hostels that don't already exist by name
 */
export const forceInitializeHostelData = async (): Promise<boolean> => {
  try {
    console.log('Force initializing hostel data with duplicate prevention...');
    
    // Fetch existing hostels to check for duplicates
    const existingHostels = await fetchHostels();
    const existingHostelNames = existingHostels.map(h => h.name.toLowerCase());
    
    console.log(`Found ${existingHostels.length} existing hostel(s): ${existingHostelNames.join(', ')}`);
    
    // Filter out hostels that already exist
    const hostelsToCreate = initialHostelData.filter(
      hostelData => !existingHostelNames.includes(hostelData.name.toLowerCase())
    );
    
    if (hostelsToCreate.length === 0) {
      console.log('All hostels already exist. No new hostels to create.');
      return true;
    }
    
    console.log(`Creating ${hostelsToCreate.length} new hostel(s)...`);
    
    for (const hostelData of hostelsToCreate) {
      console.log(`Creating ${hostelData.name}...`);
      const hostelId = await createHostel(hostelData);
      console.log(`✅ Created ${hostelData.name} with ID: ${hostelId}`);
    }
    
    console.log('🎉 Force hostel data initialization completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error force initializing hostel data:', error);
    return false;
  }
};
