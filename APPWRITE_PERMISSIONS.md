# Appwrite Permissions Documentation

This document outlines how permissions are implemented in the Appwrite-based residence application system.

## Overview

Appwrite uses a different permission model than Firebase. Instead of server-side rules, Appwrite uses document-level permissions that are set when creating or updating documents.

## Important Update: Using Teams and Roles Correctly

### Correct Role Usage
As of June 2025, we've fixed issues with role specifications. Appwrite requires specific formats:

- `Role.any()` - Anyone, authenticated or not
- `Role.users("verified")` - Any authenticated user with a verified email
- `Role.users("unverified")` - Any authenticated user with an unverified email
- `Role.team("<team-id>")` - Members of a specific team
- `Role.user("<user-id>")` - A specific user by ID

### Admin Access via Teams
For admin functionality, we now use a team-based approach:
- An "Admin" team is created automatically by the setup script
- Users must be manually added to this team through the Appwrite Console
- The application checks for Admin team membership to grant admin privileges

### Running the Permissions Fix
To update all collection permissions correctly:
```bash
npm run fix-permissions
```

## Permission Structure

### Roles Used
- `user:{userId}` - Individual user access
- `team:admin` - Admin team access 
- `users:verified` - Any verified user
- `any` - Public access (used sparingly)

### Permission Types
- `read` - Can read document
- `write` - Can update document
- `delete` - Can delete document

## Collection Permissions

### 1. USERS Collection
**Old Implementation**:
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

**Fixed Implementation**:
```javascript
// Collection level permissions
permissions: [
  Permission.read(Role.any()), // Anyone can read the users collection
  Permission.write(Role.users("verified")), // Any verified user can create documents
  Permission.update(Role.users("verified")), // Any verified user can update
  Permission.delete(Role.team("admin")) // Only admin team members can delete
]

// Document level permissions (applied programmatically)
// These are applied when creating/updating individual documents
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
**Old Implementation**:
```javascript
// When creating hostel document
permissions: [
  Permission.read(Role.team('students')),
  Permission.read(Role.team('admins')),
  Permission.write(Role.team('admins')),
  Permission.delete(Role.team('admins'))
]
```

**Fixed Implementation**:
```javascript
// Collection level permissions
permissions: [
  Permission.read(Role.any()), // Anyone can read
  Permission.write(Role.team("admin")), // Only admin team can write
  Permission.update(Role.team("admin")), // Only admin team can update
  Permission.delete(Role.team("admin")) // Only admin team can delete
]
```

**Important Note**: Hostel initialization failures were due to incorrect permission settings. The user needs to be part of the "Admin" team to create or modify hostels.

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

## Troubleshooting Common Permission Issues

### 1. Authentication Problems
If you see errors like `Document with the requested ID could not be found`:
- This happens when a user profile doesn't exist in the Users collection
- Our system now automatically creates profiles for authenticated users
- Check that the user ID matches between authentication and the database document

### 2. Authorization Errors (`401 Unauthorized`)
If you receive 401 errors when creating documents:
- The user doesn't have write permission for the collection
- For admin operations (like hostel initialization), ensure:
  - The user is properly authenticated
  - The user is a member of the Admin team
  - The collection permissions are set correctly for team access

### 3. Hostel Initialization Failures
To fix the hostel initialization issues:
1. Run `npm run fix-permissions` to update collection permissions
2. Add the appropriate user(s) to the Admin team in Appwrite Console
3. Attempt initialization again with an admin user

## Adding Users to the Admin Team
1. Go to Appwrite Console > Auth > Teams
2. Select the "Admin" team
3. Click "Add Membership"
4. Enter the user's email and add them to the team
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
