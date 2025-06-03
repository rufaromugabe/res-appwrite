import { databases, DATABASE_ID, COLLECTION_IDS, ID } from '@/lib/appwrite';

export interface ApplicationSettings {
  $id?: string;
  boyLimit: number;
  girlLimit: number;
  autoAcceptBoysLimit: number;
  autoAcceptGirlsLimit: number;
  startDateTime: string;
  endDateTime: string;
  updatedAt?: string;
}

const SETTINGS_DOCUMENT_ID = 'application-limits';

/**
 * Gets application settings
 * @returns The application settings or default values if not found
 */
export const getApplicationSettings = async (): Promise<ApplicationSettings> => {
  try {
    const settings = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_IDS.SETTINGS,
      SETTINGS_DOCUMENT_ID
    );

    return {
      $id: settings.$id,
      boyLimit: settings.boyLimit || 0,
      girlLimit: settings.girlLimit || 0,
      autoAcceptBoysLimit: settings.autoAcceptBoysLimit || 0,
      autoAcceptGirlsLimit: settings.autoAcceptGirlsLimit || 0,
      startDateTime: settings.startDateTime || "",
      endDateTime: settings.endDateTime || "",
      updatedAt: settings.updatedAt
    };
  } catch (error) {
    console.error('Error fetching application settings:', error);
    // Return default settings if document doesn't exist
    return {
      boyLimit: 0,
      girlLimit: 0,
      autoAcceptBoysLimit: 0,
      autoAcceptGirlsLimit: 0,
      startDateTime: "",
      endDateTime: ""
    };
  }
};

/**
 * Updates application settings
 * @param settings - The settings to update
 * @returns The updated settings
 */
export const updateApplicationSettings = async (
  settings: Omit<ApplicationSettings, '$id' | 'updatedAt'>
): Promise<ApplicationSettings> => {
  try {
    const settingsData = {
      ...settings,
      updatedAt: new Date().toISOString()
    };

    // Try to update existing document, or create if it doesn't exist
    let updatedSettings;
    try {
      updatedSettings = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.SETTINGS,
        SETTINGS_DOCUMENT_ID,
        settingsData
      );
    } catch (updateError) {
      // If document doesn't exist, create it
      updatedSettings = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.SETTINGS,
        SETTINGS_DOCUMENT_ID,
        settingsData
      );
    }

    return {
      $id: updatedSettings.$id,
      boyLimit: updatedSettings.boyLimit,
      girlLimit: updatedSettings.girlLimit,
      autoAcceptBoysLimit: updatedSettings.autoAcceptBoysLimit,
      autoAcceptGirlsLimit: updatedSettings.autoAcceptGirlsLimit,
      startDateTime: updatedSettings.startDateTime,
      endDateTime: updatedSettings.endDateTime,
      updatedAt: updatedSettings.updatedAt
    };
  } catch (error) {
    console.error('Error updating application settings:', error);
    throw error;
  }
};

/**
 * Checks if applications are currently open
 * @returns Boolean indicating if applications are open
 */
export const areApplicationsOpen = async (): Promise<boolean> => {
  try {
    const settings = await getApplicationSettings();
    
    if (!settings.startDateTime || !settings.endDateTime) {
      return false;
    }

    const now = new Date();
    const startDate = new Date(settings.startDateTime);
    const endDate = new Date(settings.endDateTime);

    return now >= startDate && now <= endDate;
  } catch (error) {
    console.error('Error checking application status:', error);
    return false;
  }
};

/**
 * Gets the remaining time until applications open or close
 * @returns Object with countdown information
 */
export const getApplicationCountdown = async (): Promise<{
  status: 'upcoming' | 'open' | 'closed';
  targetDate: Date | null;
  timeRemaining: string;
}> => {
  try {
    const settings = await getApplicationSettings();
    
    if (!settings.startDateTime || !settings.endDateTime) {
      return {
        status: 'closed',
        targetDate: null,
        timeRemaining: 'No application period set'
      };
    }

    const now = new Date();
    const startDate = new Date(settings.startDateTime);
    const endDate = new Date(settings.endDateTime);

    if (now < startDate) {
      // Applications haven't started yet
      return {
        status: 'upcoming',
        targetDate: startDate,
        timeRemaining: calculateTimeRemaining(now, startDate)
      };
    } else if (now <= endDate) {
      // Applications are open
      return {
        status: 'open',
        targetDate: endDate,
        timeRemaining: calculateTimeRemaining(now, endDate)
      };
    } else {
      // Applications are closed
      return {
        status: 'closed',
        targetDate: null,
        timeRemaining: 'Application period has ended'
      };
    }
  } catch (error) {
    console.error('Error getting application countdown:', error);
    return {
      status: 'closed',
      targetDate: null,
      timeRemaining: 'Error loading countdown'
    };
  }
};

/**
 * Helper function to calculate time remaining between two dates
 * @param from - Start date
 * @param to - End date
 * @returns Formatted time remaining string
 */
function calculateTimeRemaining(from: Date, to: Date): string {
  const difference = to.getTime() - from.getTime();

  if (difference <= 0) {
    return '0d 0h 0m 0s';
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export interface HostelSettings {
  $id?: string;
  paymentGracePeriod: number; // Hours after deadline before allocation is revoked
  autoRevokeUnpaidAllocations: boolean;
  maxRoomCapacity: number;
  allowMixedGender: boolean;
  updatedAt?: string;
}

const HOSTEL_SETTINGS_DOCUMENT_ID = 'hostel-settings';

/**
 * Gets hostel settings
 * @returns The hostel settings or default values if not found
 */
export const getHostelSettings = async (): Promise<HostelSettings> => {
  try {
    const settings = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_IDS.SETTINGS,
      HOSTEL_SETTINGS_DOCUMENT_ID
    );

    return {
      $id: settings.$id,
      paymentGracePeriod: settings.paymentGracePeriod || 24,
      autoRevokeUnpaidAllocations: settings.autoRevokeUnpaidAllocations || false,
      maxRoomCapacity: settings.maxRoomCapacity || 4,
      allowMixedGender: settings.allowMixedGender || false,
      updatedAt: settings.updatedAt
    };
  } catch (error) {
    console.error('Error fetching hostel settings:', error);
    // Return default settings if document doesn't exist
    return {
      paymentGracePeriod: 24,
      autoRevokeUnpaidAllocations: false,
      maxRoomCapacity: 4,
      allowMixedGender: false
    };
  }
};

/**
 * Updates hostel settings
 * @param settings - The settings to update
 * @returns The updated settings
 */
export const updateHostelSettings = async (
  settings: Omit<HostelSettings, '$id' | 'updatedAt'>
): Promise<HostelSettings> => {
  try {
    const settingsData = {
      ...settings,
      updatedAt: new Date().toISOString()
    };

    // Try to update existing document, or create if it doesn't exist
    let updatedSettings;
    try {
      updatedSettings = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.SETTINGS,
        HOSTEL_SETTINGS_DOCUMENT_ID,
        settingsData
      );
    } catch (updateError) {
      // If document doesn't exist, create it
      updatedSettings = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.SETTINGS,
        HOSTEL_SETTINGS_DOCUMENT_ID,
        settingsData
      );
    }

    return {
      $id: updatedSettings.$id,
      paymentGracePeriod: updatedSettings.paymentGracePeriod,
      autoRevokeUnpaidAllocations: updatedSettings.autoRevokeUnpaidAllocations,
      maxRoomCapacity: updatedSettings.maxRoomCapacity,
      allowMixedGender: updatedSettings.allowMixedGender,
      updatedAt: updatedSettings.updatedAt
    };
  } catch (error) {
    console.error('Error updating hostel settings:', error);
    throw error;
  }
};
