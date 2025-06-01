import { databases, DATABASE_ID, COLLECTION_IDS, Query, ID } from '@/lib/appwrite';
import { Hostel, Room, RoomAllocation, HostelSettings, Floor } from '@/types/hostel';
import { Models } from 'appwrite';

/**
 * Fetch all hostels from Appwrite
 */
export const fetchHostels = async (): Promise<Hostel[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.HOSTELS,
      [
        Query.orderAsc('name'),
        Query.limit(100)
      ]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      name: doc.name,
      description: doc.description,
      totalCapacity: doc.totalCapacity,
      currentOccupancy: doc.currentOccupancy,
      gender: doc.gender,
      floors: JSON.parse(doc.floors || '[]') as Floor[],
      isActive: doc.isActive,
      pricePerSemester: doc.pricePerSemester,
      features: JSON.parse(doc.features || '[]') as string[],
      images: JSON.parse(doc.images || '[]') as string[]
    }));
  } catch (error) {
    console.error("Error fetching hostels:", error);
    return [];
  }
};

/**
 * Fetch a specific hostel by ID
 */
export const fetchHostelById = async (hostelId: string): Promise<Hostel | null> => {
  try {
    const doc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_IDS.HOSTELS,
      hostelId
    );

    return {
      id: doc.$id,
      name: doc.name,
      description: doc.description,
      totalCapacity: doc.totalCapacity,
      currentOccupancy: doc.currentOccupancy,
      gender: doc.gender,
      floors: JSON.parse(doc.floors || '[]') as Floor[],
      isActive: doc.isActive,
      pricePerSemester: doc.pricePerSemester,
      features: JSON.parse(doc.features || '[]') as string[],
      images: JSON.parse(doc.images || '[]') as string[]
    };
  } catch (error) {
    console.error("Error fetching hostel:", error);
    return null;
  }
};

/**
 * Create a new hostel
 */
export const createHostel = async (hostel: Omit<Hostel, 'id'>): Promise<string> => {
  try {
    // Check for duplicate names
    const existingHostels = await fetchHostels();
    const duplicate = existingHostels.find(
      existing => existing.name.toLowerCase().trim() === hostel.name.toLowerCase().trim()
    );
    
    if (duplicate) {
      console.log(`Hostel "${hostel.name}" already exists with ID: ${duplicate.id}. Skipping creation.`);
      return duplicate.id;
    }

    const newHostel = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.HOSTELS,
      ID.unique(),
      {
        name: hostel.name,
        description: hostel.description,
        totalCapacity: hostel.totalCapacity,
        currentOccupancy: hostel.currentOccupancy,
        gender: hostel.gender,
        floors: JSON.stringify(hostel.floors),
        isActive: hostel.isActive,
        pricePerSemester: hostel.pricePerSemester,
        features: JSON.stringify(hostel.features),
        images: JSON.stringify(hostel.images || []),
        createdAt: new Date().toISOString()
      }
    );

    console.log(`Successfully created hostel "${hostel.name}" with ID: ${newHostel.$id}`);
    return newHostel.$id;
  } catch (error) {
    console.error("Error creating hostel:", error);
    throw error;
  }
};

/**
 * Update an existing hostel
 */
export const updateHostel = async (hostelId: string, updates: Partial<Hostel>): Promise<void> => {
  try {
    const updateData: Record<string, any> = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.totalCapacity !== undefined) updateData.totalCapacity = updates.totalCapacity;
    if (updates.currentOccupancy !== undefined) updateData.currentOccupancy = updates.currentOccupancy;
    if (updates.gender !== undefined) updateData.gender = updates.gender;
    if (updates.floors !== undefined) updateData.floors = JSON.stringify(updates.floors);
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.pricePerSemester !== undefined) updateData.pricePerSemester = updates.pricePerSemester;
    if (updates.features !== undefined) updateData.features = JSON.stringify(updates.features);
    if (updates.images !== undefined) updateData.images = JSON.stringify(updates.images);

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.HOSTELS,
      hostelId,
      updateData
    );
  } catch (error) {
    console.error("Error updating hostel:", error);
    throw error;
  }
};

/**
 * Delete a hostel
 */
export const deleteHostel = async (hostelId: string): Promise<void> => {
  try {
    // Remove all related room allocations before deleting the hostel
    const allocationsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.ROOM_ALLOCATIONS,
      [
        Query.equal('hostelId', hostelId),
        Query.limit(1000)
      ]
    );

    // Delete all allocations
    const deletePromises = allocationsResponse.documents.map(doc => 
      databases.deleteDocument(DATABASE_ID, COLLECTION_IDS.ROOM_ALLOCATIONS, doc.$id)
    );
    await Promise.all(deletePromises);

    console.log(`Removed ${allocationsResponse.documents.length} allocation(s) for hostel ${hostelId}`);

    // Delete the hostel document
    await databases.deleteDocument(DATABASE_ID, COLLECTION_IDS.HOSTELS, hostelId);
  } catch (error) {
    console.error("Error deleting hostel:", error);
    throw error;
  }
};

/**
 * Fetch available rooms for a specific gender
 */
export const fetchAvailableRooms = async (gender: 'Male' | 'Female'): Promise<Room[]> => {
  try {
    const hostels = await fetchHostels();
    const availableRooms: Room[] = [];

    hostels.forEach(hostel => {
      if (hostel.isActive && (hostel.gender === gender || hostel.gender === 'Mixed')) {
        hostel.floors.forEach(floor => {
          floor.rooms.forEach(room => {
            if (room.isAvailable && 
                !room.isReserved && 
                room.occupants.length < room.capacity &&
                (room.gender === gender || room.gender === 'Mixed')) {
              availableRooms.push({
                ...room,
                hostelName: hostel.name,
                floorName: floor.name,
                price: hostel.pricePerSemester
              });
            }
          });
        });
      }
    });

    return availableRooms;
  } catch (error) {
    console.error("Error fetching available rooms:", error);
    return [];
  }
};

/**
 * Allocate a room to a student
 */
export const allocateRoom = async (
  studentRegNumber: string,
  roomId: string,
  hostelId: string,
  userId?: string
): Promise<RoomAllocation> => {
  try {
    // Fetch hostel settings to get the grace period (which equals the deadline)
    const settings = await fetchHostelSettings();
    
    // Create room allocation record
    const allocation: Omit<RoomAllocation, 'id'> = {
      studentRegNumber,
      roomId,
      hostelId,
      allocatedAt: new Date().toISOString(),
      paymentStatus: 'Pending',
      paymentDeadline: new Date(Date.now() + settings.paymentGracePeriod * 60 * 60 * 1000).toISOString(),
      semester: getCurrentSemester(),
      academicYear: getCurrentAcademicYear()
    };

    const newAllocation = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.ROOM_ALLOCATIONS,
      ID.unique(),
      {
        ...allocation,
        userId: userId || null
      }
    );

    // Update room occupancy
    const hostel = await fetchHostelById(hostelId);
    if (hostel) {
      const updatedHostel = { ...hostel };
      updatedHostel.floors.forEach(floor => {
        floor.rooms.forEach(room => {
          if (room.id === roomId) {
            room.occupants.push(studentRegNumber);
            if (room.occupants.length >= room.capacity) {
              room.isAvailable = false;
            }
          }
        });
      });
      
      await updateHostel(hostelId, updatedHostel);
    }

    return {
      id: newAllocation.$id,
      ...allocation
    };
  } catch (error) {
    console.error("Error allocating room:", error);
    throw error;
  }
};

/**
 * Fetch room allocations
 */
export const fetchRoomAllocations = async (): Promise<RoomAllocation[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.ROOM_ALLOCATIONS,
      [
        Query.orderDesc('allocatedAt'),
        Query.limit(1000)
      ]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      studentRegNumber: doc.studentRegNumber,
      roomId: doc.roomId,
      hostelId: doc.hostelId,
      allocatedAt: doc.allocatedAt,
      paymentStatus: doc.paymentStatus,
      paymentDeadline: doc.paymentDeadline,
      semester: doc.semester,
      academicYear: doc.academicYear,
      paymentId: doc.paymentId
    }));
  } catch (error) {
    console.error("Error fetching room allocations:", error);
    return [];
  }
};

/**
 * Fetch allocation by student registration number
 */
export const fetchAllocationByStudent = async (regNumber: string): Promise<RoomAllocation | null> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.ROOM_ALLOCATIONS,
      [
        Query.equal('studentRegNumber', regNumber),
        Query.orderDesc('allocatedAt'),
        Query.limit(1)
      ]
    );

    if (response.documents.length === 0) {
      return null;
    }

    const doc = response.documents[0];
    return {
      id: doc.$id,
      studentRegNumber: doc.studentRegNumber,
      roomId: doc.roomId,
      hostelId: doc.hostelId,
      allocatedAt: doc.allocatedAt,
      paymentStatus: doc.paymentStatus,
      paymentDeadline: doc.paymentDeadline,
      semester: doc.semester,
      academicYear: doc.academicYear,
      paymentId: doc.paymentId
    };
  } catch (error) {
    console.error("Error fetching allocation by student:", error);
    return null;
  }
};

/**
 * Fetch allocation by allocation ID
 */
export const fetchAllocationById = async (allocationId: string): Promise<RoomAllocation | null> => {
  try {
    const doc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_IDS.ROOM_ALLOCATIONS,
      allocationId
    );

    return {
      id: doc.$id,
      studentRegNumber: doc.studentRegNumber,
      roomId: doc.roomId,
      hostelId: doc.hostelId,
      allocatedAt: doc.allocatedAt,
      paymentStatus: doc.paymentStatus,
      paymentDeadline: doc.paymentDeadline,
      semester: doc.semester,
      academicYear: doc.academicYear,
      paymentId: doc.paymentId
    };
  } catch (error) {
    console.error("Error fetching allocation by ID:", error);
    return null;
  }
};

/**
 * Update room allocation
 */
export const updateRoomAllocation = async (
  allocationId: string,
  updates: Partial<RoomAllocation>
): Promise<void> => {
  try {
    const updateData: Record<string, any> = {};
    
    if (updates.paymentStatus !== undefined) updateData.paymentStatus = updates.paymentStatus;
    if (updates.paymentDeadline !== undefined) updateData.paymentDeadline = updates.paymentDeadline;
    if (updates.paymentId !== undefined) updateData.paymentId = updates.paymentId;

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.ROOM_ALLOCATIONS,
      allocationId,
      updateData
    );
  } catch (error) {
    console.error("Error updating room allocation:", error);
    throw error;
  }
};

/**
 * Revoke room allocation (remove student from room)
 */
export const revokeRoomAllocation = async (allocationId: string): Promise<void> => {
  try {
    // Get the allocation details
    const allocation = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_IDS.ROOM_ALLOCATIONS,
      allocationId
    );

    const studentRegNumber = allocation.studentRegNumber;
    const roomId = allocation.roomId;
    const hostelId = allocation.hostelId;

    // Remove student from room occupants
    const hostel = await fetchHostelById(hostelId);
    if (hostel) {
      const updatedHostel = { ...hostel };
      updatedHostel.floors.forEach(floor => {
        floor.rooms.forEach(room => {
          if (room.id === roomId) {
            room.occupants = room.occupants.filter(occupant => occupant !== studentRegNumber);
            room.isAvailable = true; // Room becomes available again
          }
        });
      });
      
      await updateHostel(hostelId, updatedHostel);
    }

    // Delete the allocation
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_IDS.ROOM_ALLOCATIONS,
      allocationId
    );

    console.log(`Successfully revoked allocation ${allocationId} for student ${studentRegNumber}`);
  } catch (error) {
    console.error("Error revoking room allocation:", error);
    throw error;
  }
};

/**
 * Check and update overdue payments
 */
export const checkAndUpdateOverduePayments = async (): Promise<void> => {
  try {
    const now = new Date();
    const allocations = await fetchRoomAllocations();
    
    const overdueAllocations = allocations.filter(allocation => 
      allocation.paymentStatus === 'Pending' && 
      new Date(allocation.paymentDeadline) < now
    );

    const updatePromises = overdueAllocations.map(allocation =>
      updateRoomAllocation(allocation.id, { paymentStatus: 'Overdue' })
    );

    await Promise.all(updatePromises);
    
    console.log(`Updated ${overdueAllocations.length} allocations to overdue status`);

    // Auto-revoke if enabled in settings
    const settings = await fetchHostelSettings();
    if (settings.autoRevokeUnpaidAllocations) {
      const revokePromises = overdueAllocations.map(allocation =>
        revokeRoomAllocation(allocation.id)
      );
      await Promise.all(revokePromises);
      console.log(`Auto-revoked ${overdueAllocations.length} overdue allocations`);
    }
  } catch (error) {
    console.error("Error checking and updating overdue payments:", error);
    throw error;
  }
};

/**
 * Get hostel settings
 */
export const fetchHostelSettings = async (): Promise<HostelSettings> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.SETTINGS,
      [Query.limit(1)]
    );
    
    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return {
        paymentGracePeriod: doc.paymentGracePeriod,
        autoRevokeUnpaidAllocations: doc.autoRevokeUnpaidAllocations,
        maxRoomCapacity: doc.maxRoomCapacity,
        allowMixedGender: doc.allowMixedGender
      };
    }
    
    // Return default settings
    return {
      paymentGracePeriod: 168, // 168 hours = 7 days
      autoRevokeUnpaidAllocations: true,
      maxRoomCapacity: 4,
      allowMixedGender: false
    };
  } catch (error) {
    console.error("Error fetching hostel settings:", error);
    return {
      paymentGracePeriod: 168,
      autoRevokeUnpaidAllocations: true,
      maxRoomCapacity: 4,
      allowMixedGender: false
    };
  }
};

/**
 * Update hostel settings
 */
export const updateHostelSettings = async (settings: HostelSettings): Promise<void> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.SETTINGS,
      [Query.limit(1)]
    );

    const updateData = {
      ...settings,
      updatedAt: new Date().toISOString()
    };

    if (response.documents.length > 0) {
      // Update existing settings
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.SETTINGS,
        response.documents[0].$id,
        updateData
      );
    } else {
      // Create new settings document
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.SETTINGS,
        ID.unique(),
        updateData
      );
    }
  } catch (error) {
    console.error("Error updating hostel settings:", error);
    throw error;
  }
};

/**
 * Get room details from allocation
 */
export const getRoomDetailsFromAllocation = async (
  allocation: RoomAllocation
): Promise<{room: Room, hostel: Hostel, price: number} | null> => {
  try {
    const hostel = await fetchHostelById(allocation.hostelId);
    if (!hostel) return null;
    
    let roomDetails: Room | null = null;
    
    // Find the room in the hostel
    for (const floor of hostel.floors) {
      const room = floor.rooms.find(r => r.id === allocation.roomId);
      if (room) {
        roomDetails = {
          ...room,
          hostelName: hostel.name,
          floorName: floor.name,
          price: hostel.pricePerSemester
        };
        break;
      }
    }
    
    if (!roomDetails) return null;
    
    return {
      room: roomDetails,
      hostel: hostel,
      price: hostel.pricePerSemester
    };
  } catch (error) {
    console.error("Error getting room details from allocation:", error);
    return null;
  }
};

/**
 * Reserve a room for admin purposes
 * @param roomId - The room ID to reserve
 * @param hostelId - The hostel ID containing the room
 * @param adminEmail - The email of the admin making the reservation
 * @param days - Number of days to reserve the room for
 */
export const reserveRoom = async (
  roomId: string,
  hostelId: string,
  adminEmail: string,
  days: number
): Promise<void> => {
  try {
    const hostel = await fetchHostelById(hostelId);
    if (!hostel) {
      throw new Error('Hostel not found');
    }

    // Find and update the room
    let roomFound = false;
    const reservedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    hostel.floors.forEach(floor => {
      floor.rooms.forEach(room => {
        if (room.id === roomId) {
          room.isReserved = true;
          room.reservedBy = adminEmail;
          room.reservedUntil = reservedUntil;
          roomFound = true;
        }
      });
    });

    if (!roomFound) {
      throw new Error('Room not found');
    }

    await updateHostel(hostelId, hostel);
  } catch (error) {
    console.error('Error reserving room:', error);
    throw error;
  }
};

/**
 * Unreserve a room
 * @param roomId - The room ID to unreserve
 * @param hostelId - The hostel ID containing the room
 */
export const unreserveRoom = async (roomId: string, hostelId: string): Promise<void> => {
  try {
    const hostel = await fetchHostelById(hostelId);
    if (!hostel) {
      throw new Error('Hostel not found');
    }

    // Find and update the room
    let roomFound = false;
    hostel.floors.forEach(floor => {
      floor.rooms.forEach(room => {
        if (room.id === roomId) {
          room.isReserved = false;
          delete room.reservedBy;
          delete room.reservedUntil;
          roomFound = true;
        }
      });
    });

    if (!roomFound) {
      throw new Error('Room not found');
    }

    await updateHostel(hostelId, hostel);
  } catch (error) {
    console.error('Error unreserving room:', error);
    throw error;
  }
};

/**
 * Add multiple rooms in a range to a floor
 * @param hostelId - The hostel ID
 * @param floorId - The floor ID
 * @param startNumber - Starting room number
 * @param endNumber - Ending room number
 * @param prefix - Room number prefix
 * @param suffix - Room number suffix
 * @param capacity - Room capacity
 * @param gender - Room gender restriction
 * @param features - Room features
 */
export const addRoomsInRange = async (
  hostelId: string,
  floorId: string,
  startNumber: number,
  endNumber: number,
  prefix: string,
  suffix: string,
  capacity: number,
  gender: 'Male' | 'Female' | 'Mixed',
  features: string[]
): Promise<void> => {
  try {
    const hostel = await fetchHostelById(hostelId);
    if (!hostel) {
      throw new Error('Hostel not found');
    }

    // Find the floor
    const floor = hostel.floors.find(f => f.id === floorId);
    if (!floor) {
      throw new Error('Floor not found');
    }

    // Generate new rooms
    const newRooms: Room[] = [];
    for (let i = startNumber; i <= endNumber; i++) {
      const roomNumber = `${prefix}${i}${suffix}`;
      const roomId = `${hostelId}_${floorId}_${roomNumber}`;

      // Check if room already exists
      const existingRoom = floor.rooms.find(r => r.number === roomNumber);
      if (!existingRoom) {
        newRooms.push({
          id: roomId,
          number: roomNumber,
          floor: floor.name,
          floorName: floor.name,
          hostelName: hostel.name,
          price: hostel.pricePerSemester,
          capacity,
          occupants: [],
          gender,
          isReserved: false,
          isAvailable: true,
          features
        });
      }
    }

    // Add new rooms to the floor
    floor.rooms.push(...newRooms);

    // Update total capacity
    hostel.totalCapacity += newRooms.reduce((total, room) => total + room.capacity, 0);

    await updateHostel(hostelId, hostel);
  } catch (error) {
    console.error('Error adding rooms in range:', error);
    throw error;
  }
};

/**
 * Add a new floor to a hostel
 * @param hostelId - The hostel ID
 * @param floorNumber - The floor number
 * @param floorName - The floor name
 */
export const addFloorToHostel = async (
  hostelId: string,
  floorNumber: string,
  floorName: string
): Promise<void> => {
  try {
    const hostel = await fetchHostelById(hostelId);
    if (!hostel) {
      throw new Error('Hostel not found');
    }

    // Check if floor already exists
    const existingFloor = hostel.floors.find(f => f.number === floorNumber || f.name === floorName);
    if (existingFloor) {
      throw new Error('Floor already exists');
    }

    // Create new floor
    const newFloor: Floor = {
      id: `${hostelId}_floor_${floorNumber}`,
      number: floorNumber,
      name: floorName,
      rooms: []
    };

    // Add floor to hostel
    hostel.floors.push(newFloor);

    await updateHostel(hostelId, hostel);
  } catch (error) {
    console.error('Error adding floor to hostel:', error);
    throw error;
  }
};

/**
 * Remove a room from a hostel and all related allocations
 * @param hostelId - The hostel ID
 * @param roomId - The room ID to remove
 */
export const removeRoom = async (hostelId: string, roomId: string): Promise<void> => {
  try {
    const hostel = await fetchHostelById(hostelId);
    if (!hostel) {
      throw new Error('Hostel not found');
    }

    // Find and remove the room
    let roomRemoved = false;
    let roomCapacity = 0;
    hostel.floors.forEach(floor => {
      const roomIndex = floor.rooms.findIndex(r => r.id === roomId);
      if (roomIndex !== -1) {
        roomCapacity = floor.rooms[roomIndex].capacity;
        floor.rooms.splice(roomIndex, 1);
        roomRemoved = true;
      }
    });

    if (!roomRemoved) {
      throw new Error('Room not found');
    }

    // Update total capacity
    hostel.totalCapacity -= roomCapacity;

    await updateHostel(hostelId, hostel);

    // Remove related room allocations
    try {
      const allocations = await fetchRoomAllocations();
      const roomAllocations = allocations.filter(allocation => allocation.roomId === roomId);
      
      for (const allocation of roomAllocations) {
        await revokeRoomAllocation(allocation.id);
      }
    } catch (error) {
      console.error('Error removing room allocations:', error);
      // Continue even if allocation removal fails
    }
  } catch (error) {
    console.error('Error removing room:', error);
    throw error;
  }
};

/**
 * Remove a floor from a hostel and all related rooms and allocations
 * @param hostelId - The hostel ID
 * @param floorId - The floor ID to remove
 */
export const removeFloor = async (hostelId: string, floorId: string): Promise<void> => {
  try {
    const hostel = await fetchHostelById(hostelId);
    if (!hostel) {
      throw new Error('Hostel not found');
    }

    // Find the floor to remove
    const floorIndex = hostel.floors.findIndex(f => f.id === floorId);
    if (floorIndex === -1) {
      throw new Error('Floor not found');
    }

    const floor = hostel.floors[floorIndex];
    const removedCapacity = floor.rooms.reduce((total, room) => total + room.capacity, 0);

    // Get all room IDs for allocation removal
    const roomIds = floor.rooms.map(room => room.id);

    // Remove the floor
    hostel.floors.splice(floorIndex, 1);

    // Update total capacity
    hostel.totalCapacity -= removedCapacity;

    await updateHostel(hostelId, hostel);

    // Remove related room allocations
    try {
      const allocations = await fetchRoomAllocations();
      const floorAllocations = allocations.filter(allocation => roomIds.includes(allocation.roomId));
      
      for (const allocation of floorAllocations) {
        await revokeRoomAllocation(allocation.id);
      }
    } catch (error) {
      console.error('Error removing floor allocations:', error);
      // Continue even if allocation removal fails
    }
  } catch (error) {
    console.error('Error removing floor:', error);
    throw error;
  }
};

/**
 * Remove an occupant from a room and revoke their allocation
 * @param hostelId - The hostel ID
 * @param roomId - The room ID
 * @param regNumber - The registration number of the occupant to remove
 */
export const removeOccupantFromRoom = async (
  hostelId: string,
  roomId: string,
  regNumber: string
): Promise<void> => {
  try {
    const hostel = await fetchHostelById(hostelId);
    if (!hostel) {
      throw new Error('Hostel not found');
    }

    // Find and update the room
    let occupantRemoved = false;
    hostel.floors.forEach(floor => {
      floor.rooms.forEach(room => {
        if (room.id === roomId) {
          const occupantIndex = room.occupants.findIndex(occ => occ === regNumber);
          if (occupantIndex !== -1) {
            room.occupants.splice(occupantIndex, 1);
            
            // Update room availability
            if (room.occupants.length < room.capacity) {
              room.isAvailable = true;
            }
            
            occupantRemoved = true;
          }
        }
      });
    });

    if (!occupantRemoved) {
      throw new Error('Occupant not found in room');
    }

    // Update current occupancy
    hostel.currentOccupancy = hostel.floors.reduce((total, floor) => 
      total + floor.rooms.reduce((floorTotal, room) => floorTotal + room.occupants.length, 0), 0
    );

    await updateHostel(hostelId, hostel);

    // Find and revoke the room allocation
    try {
      const allocation = await fetchAllocationByStudent(regNumber);
      if (allocation && allocation.roomId === roomId) {
        await revokeRoomAllocation(allocation.id);
      }
    } catch (error) {
      console.error('Error revoking allocation:', error);
      // Continue even if allocation revocation fails
    }
  } catch (error) {
    console.error('Error removing occupant from room:', error);
    throw error;
  }
};

/**
 * Fetch all room allocations from Appwrite (for admin/system use)
 */
export const fetchAllRoomAllocations = async (): Promise<RoomAllocation[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.ROOM_ALLOCATIONS,
      [
        Query.limit(1000), // Adjust as needed for your system
        Query.orderDesc('allocatedAt')
      ]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      studentRegNumber: doc.studentRegNumber,
      roomId: doc.roomId,
      hostelId: doc.hostelId,
      allocatedAt: doc.allocatedAt,
      paymentStatus: doc.paymentStatus,
      paymentDeadline: doc.paymentDeadline,
      semester: doc.semester,
      academicYear: doc.academicYear,
      paymentId: doc.paymentId
    }));
  } catch (error) {
    console.error('Error fetching all room allocations:', error);
    throw error;
  }
};

// Helper functions
function getCurrentSemester(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= 8 || month <= 1 ? "Semester 1" : "Semester 2";
}

function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  if (month >= 8) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
}
