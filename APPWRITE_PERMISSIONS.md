# Appwrite Permissions Documentation - SIMPLIFIED

This document outlines the simplified permissions implementation in the Appwrite-based residence application system.

## Overview - SIMPLIFIED APPROACH

We've simplified the permission model to use basic user authentication instead of complex team-based roles. All role-based access control is now handled at the application level rather than the database level.

## Simplified Permission Structure

### Single Permission Level
All collections now use the same simple permission structure:
- `Permission.read(Role.users())` - Any authenticated user can read
- `Permission.create(Role.users())` - Any authenticated user can create
- `Permission.update(Role.users())` - Any authenticated user can update  
- `Permission.delete(Role.users())` - Any authenticated user can delete

### Role-Based Access Control
Access control is handled in the application code by checking the user's role property:
```javascript
// In your components/hooks
const { user } = useAppwriteAuth();
const userDoc = await getUserDocument(user.$id);
const isAdmin = userDoc.role === 'admin';

if (isAdmin) {
  // Allow admin operations
} else {
  // Restrict to user operations
}
```

## Collection Permissions - ALL SIMPLIFIED

### All Collections (Users, Students, Applications, Hostels, Rooms, Payments, Room Allocations, Settings)
**Unified Simple Implementation**:
```javascript
// Collection level permissions (applied to all collections)
permissions: [
  Permission.read(Role.users()), // Any authenticated user can read
  Permission.create(Role.users()), // Any authenticated user can create
  Permission.update(Role.users()), // Any authenticated user can update
  Permission.delete(Role.users()) // Any authenticated user can delete
]
```

**Application-Level Access Control**:
```javascript
// Check user role in your application code
const checkAdminAccess = async (userId) => {
  const userDoc = await databases.getDocument(DATABASE_ID, 'users', userId);
  return userDoc.role === 'admin';
};

// Example usage in components
const handleAdminAction = async () => {
  const isAdmin = await checkAdminAccess(user.$id);
  if (!isAdmin) {
    toast.error('Admin access required');
    return;
  }
  // Proceed with admin action
};
```

## Benefits of Simplified Approach

1. **No Team Management**: No need to create or manage teams in Appwrite Console
2. **Easier Setup**: Single permission structure for all collections
3. **Application Control**: All access control logic in your application code
4. **Flexibility**: Easy to modify access rules without database changes
5. **Debugging**: Clear understanding of who can access what

## Migration Steps

1. **Update Collection Permissions**:
   ```powershell
   node scripts/update-collection-permissions.js
   ```

2. **Remove Team Dependencies**: Teams are no longer required - simplified permissions apply to all collections

3. **Update Application Logic**: Ensure your application code checks user roles appropriately

## Troubleshooting Common Issues - SIMPLIFIED

### 1. Authentication Problems
If you see errors like `Document with the requested ID could not be found`:
- Ensure the user is properly authenticated
- Check that the user document exists in the Users collection
- Verify the user ID matches between authentication and database

### 2. No More Permission Errors
With simplified permissions, you should no longer see:
- `401 Unauthorized` errors for database operations
- Team membership requirements
- Complex permission setup issues

### 3. Application-Level Access Control
All role-based restrictions are now handled in your application:
```javascript
// Example: Protecting admin routes
if (userRole !== 'admin') {
  router.push('/unauthorized');
  return;
}
```

## Setup Instructions

### 1. Run Permission Update Script
```powershell
node scripts/update-collection-permissions.js
```

### 2. No Team Setup Required
- No teams need to be created
- No users need to be added to teams
- All access control is in application logic

### 3. User Role Management
Set user roles directly in the Users collection:
```javascript
// When creating a user document
await databases.createDocument(DATABASE_ID, 'users', userId, {
  email: user.email,
  role: 'admin', // or 'user'
  // other fields...
});
```
