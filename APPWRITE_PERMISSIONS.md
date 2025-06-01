# Appwrite Permissions Documentation

This document outlines how Firebase security rules have been translated to Appwrite permissions in the residence application system.

## Overview

Appwrite uses a different permission model than Firebase. Instead of server-side rules, Appwrite uses document-level permissions that are set when creating or updating documents.

## Permission Structure

### Roles Used
- `user:{userId}` - Individual user access
- `team:admins` - Admin team access
- `team:students` - General student team access
- `any` - Public access (used sparingly)

### Permission Types
- `read` - Can read document
- `write` - Can update document
- `delete` - Can delete document

## Collection Permissions

### 1. USERS Collection
**Firebase Rule**: Users can read/update their own profile, admins can read/update/delete any profile
**Appwrite Implementation**:
```javascript
// When creating user document
permissions: [
  Permission.read(Role.user(userId)),
  Permission.write(Role.user(userId)),
  Permission.read(Role.team('admins')),
  Permission.write(Role.team('admins')),
  Permission.delete(Role.team('admins'))
]
```

### 2. STUDENTS Collection
**Firebase Rule**: Similar to users - own profile access + admin access
**Appwrite Implementation**:
```javascript
// When creating student document
permissions: [
  Permission.read(Role.user(userId)),
  Permission.write(Role.user(userId)),
  Permission.read(Role.team('admins')),
  Permission.write(Role.team('admins')),
  Permission.delete(Role.team('admins'))
]
```

### 3. APPLICATIONS Collection
**Firebase Rule**: Students can read/create their own, admins can read/update/delete any
**Appwrite Implementation**:
```javascript
// When creating application document
permissions: [
  Permission.read(Role.user(userId)),
  Permission.write(Role.user(userId)), // For creating only
  Permission.read(Role.team('admins')),
  Permission.write(Role.team('admins')),
  Permission.delete(Role.team('admins'))
]
```

### 4. HOSTELS Collection
**Firebase Rule**: Anyone authenticated can read, only admins can modify
**Appwrite Implementation**:
```javascript
// When creating hostel document
permissions: [
  Permission.read(Role.team('students')),
  Permission.read(Role.team('admins')),
  Permission.write(Role.team('admins')),
  Permission.delete(Role.team('admins'))
]
```

### 5. ROOMS Collection
**Firebase Rule**: Anyone authenticated can read, only admins can modify
**Appwrite Implementation**:
```javascript
// Rooms are embedded in hostels, so permissions follow hostel permissions
```

### 6. PAYMENTS Collection
**Firebase Rule**: Students can read/create/update their own (if pending), admins can do anything
**Appwrite Implementation**:
```javascript
// When creating payment document
permissions: [
  Permission.read(Role.user(userId)),
  Permission.write(Role.user(userId)), // Limited by business logic
  Permission.read(Role.team('admins')),
  Permission.write(Role.team('admins')),
  Permission.delete(Role.team('admins'))
]
```

### 7. ROOM_ALLOCATIONS Collection
**Firebase Rule**: Students can read their own, admins can do anything
**Appwrite Implementation**:
```javascript
// When creating allocation document
permissions: [
  Permission.read(Role.user(userId)),
  Permission.read(Role.team('admins')),
  Permission.write(Role.team('admins')),
  Permission.delete(Role.team('admins'))
]
```

### 8. SETTINGS Collection
**Firebase Rule**: Admins only
**Appwrite Implementation**:
```javascript
// When creating settings document
permissions: [
  Permission.read(Role.team('admins')),
  Permission.write(Role.team('admins')),
  Permission.delete(Role.team('admins'))
]
```

## Implementation Notes

### Team Management
Teams must be created and managed through Appwrite console or functions:
- `admins` team: Contains admin users
- `students` team: Contains all authenticated students (optional, can use individual user permissions)

### Dynamic Permissions
Some permissions are set dynamically based on business logic:
- Student payments: Only students can update their own pending payments
- Applications: Students can only create, admins can update status
- Allocations: Only admins can create/modify

### Migration Considerations
1. **Team Setup**: Create admin and student teams in Appwrite
2. **User Assignment**: Assign users to appropriate teams during authentication
3. **Document Creation**: Ensure all new documents have proper permissions
4. **Migration Script**: Set permissions on existing documents during data migration

## Security Benefits
- **Granular Control**: Document-level permissions provide fine-grained access control
- **Client-Side Enforcement**: Permissions are enforced at the database level
- **Team-Based Access**: Easier role management through teams
- **Audit Trail**: Permission changes are tracked with document versions

## Testing Permissions
Use the Appwrite console or SDK to test permissions:
```javascript
// Test if user can read document
try {
  const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, documentId);
  console.log('Read access granted');
} catch (error) {
  console.log('Read access denied:', error.message);
}
```
