# 🗄️ Complete Appwrite Database Management Guide

This guide covers the comprehensive database setup and management system for your Student Affairs Residential Application.

## 📋 Overview

The database management system consists of:
- **Complete Setup Script**: `complete-database-setup.js` - One script to rule them all
- **Interactive Manager**: `db-manager.js` - User-friendly menu interface
- **Legacy Scripts**: Individual scripts for specific operations (deprecated)

## 🚀 Quick Start

### Option 1: Interactive Manager (Recommended for beginners)
```powershell
npm run db:manager
```
This opens an interactive menu where you can choose operations visually.

### Option 2: Direct Commands (Recommended for automation)
```powershell
# Complete database setup (first-time or full reset)
npm run db:setup

# Individual operations
npm run db:inspect      # View database structure
npm run db:create       # Create missing collections
npm run db:fix          # Fix missing attributes
npm run db:permissions  # Update permissions
```

## 🏗️ Database Schema

### Collections Created

1. **Users** (`users`)
   - User authentication and profile data
   - Links to Appwrite Auth users
   - Role-based access control

2. **Students** (`students`)  
   - Student profile information
   - Registration numbers, programmes, contact info
   - Links to Users collection

3. **Applications** (`applications`)
   - Student accommodation applications
   - Status tracking (Pending, Accepted, Archived)
   - Payment status integration

4. **Hostels** (`hostels`)
   - Hostel information and management
   - Capacity, pricing, features
   - Gender restrictions and availability

5. **Rooms** (`rooms`)
   - Individual room management
   - Occupancy tracking and reservations
   - Pricing and availability status

6. **Payments** (`payments`)
   - Payment records and receipts
   - Approval workflow
   - Multiple payment methods support

7. **Room Allocations** (`roomAllocations`)
   - Student-room assignments
   - Payment deadline tracking
   - Semester and academic year tracking

8. **Settings** (`settings`)
   - System configuration
   - Payment grace periods
   - Capacity limits and policies

## 🔧 Script Features

### ✅ What the Complete Script Does

1. **Safety First**
   - Non-destructive operations
   - Idempotent (safe to run multiple times)
   - Comprehensive error handling
   - Detailed logging

2. **Collection Management**
   - Creates missing collections
   - Adds missing attributes to existing collections
   - Creates database indexes for performance
   - Sets up proper permissions

3. **Schema Validation**
   - Ensures all required attributes exist
   - Validates data types and constraints
   - Maintains referential integrity

4. **Permission Management**
   - Role-based access control
   - User authentication requirements
   - Proper read/write permissions

### 📊 Detailed Operations

#### Database Inspection (`db:inspect`)
```powershell
npm run db:inspect
```
- Lists all collections and their attributes
- Shows data types, sizes, and constraints
- Displays permission settings
- Identifies missing or misconfigured elements

#### Collection Creation (`db:create`)
```powershell
npm run db:create
```
- Creates all required collections
- Adds complete attribute schema
- Creates database indexes
- Sets up initial permissions
- Skips existing collections safely

#### Attribute Fixing (`db:fix`)
```powershell
npm run db:fix
```
- Scans existing collections for missing attributes
- Adds missing attributes with proper types
- Maintains existing data integrity
- Updates schema to match latest requirements

#### Permission Updates (`db:permissions`)
```powershell
npm run db:permissions
```
- Updates collection permissions
- Sets user-based access control
- Ensures proper authentication requirements
- Maintains security best practices

## 🛠️ Prerequisites

### Environment Configuration

Create a `.env.local` file in your project root:

```env
# Appwrite Configuration
APPWRITE_ENDPOINT=https://your-appwrite-endpoint/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-server-api-key

# Make sure your API key has the following permissions:
# - Database: Read, Write, Create, Delete
# - Collections: Read, Write, Create, Delete, Update
# - Attributes: Read, Write, Create, Delete
# - Indexes: Read, Write, Create, Delete
```

### Required Permissions

Your Appwrite API key needs these scopes:
- `databases.read`
- `databases.write` 
- `collections.read`
- `collections.write`
- `collections.create`
- `collections.delete`
- `attributes.read`
- `attributes.write`
- `attributes.create`
- `attributes.delete`
- `indexes.read`
- `indexes.write`
- `indexes.create`
- `indexes.delete`

## 🔍 Troubleshooting

### Common Issues

#### 1. API Key Permissions
```
Error: Missing scope permissions
```
**Solution**: Ensure your API key has all required database permissions.

#### 2. Network Connectivity
```
Error: Failed to connect to Appwrite endpoint
```
**Solution**: Check your `APPWRITE_ENDPOINT` and network connection.

#### 3. Database Not Found
```
Error: Database not found
```
**Solution**: Create the database in Appwrite Console or update `APPWRITE_DATABASE_ID`.

#### 4. Collection Already Exists
```
Error: Collection with the same ID already exists
```
**Solution**: This is normal - the script will skip existing collections safely.

#### 5. SDK Version Warning
```
Warning: SDK version mismatch
```
**Solution**: This is usually safe to ignore, but consider updating your Appwrite server or downgrading the SDK if you encounter issues.

### Debug Mode

For detailed debugging, you can modify the script to add more verbose logging:

```javascript
// Add this to the top of complete-database-setup.js for debugging
console.log('Environment check:');
console.log('- Endpoint:', process.env.APPWRITE_ENDPOINT);
console.log('- Project:', process.env.APPWRITE_PROJECT_ID);
console.log('- Database:', process.env.APPWRITE_DATABASE_ID);
console.log('- API Key length:', process.env.APPWRITE_API_KEY?.length);
```

## 📚 Usage Examples

### First-Time Setup
```powershell
# Check what exists currently
npm run db:inspect

# Run complete setup
npm run db:setup

# Verify everything was created
npm run db:inspect
```

### Adding New Attributes
1. Update the schema in `complete-database-setup.js`
2. Run the fix command:
```powershell
npm run db:fix
```

### Updating Permissions
```powershell
npm run db:permissions
```

### Regular Maintenance
```powershell
# Weekly check of database state
npm run db:inspect

# Fix any drift from expected schema
npm run db:fix
```

## 🔄 Migration from Legacy Scripts

If you were using the individual scripts before:

| Old Script | New Command |
|------------|-------------|
| `npm run create-collections` | `npm run db:create` |
| `npm run inspect-db` | `npm run db:inspect` |
| `npm run fix-attributes` | `npm run db:fix` |
| `npm run fix-permissions` | `npm run db:permissions` |

### Benefits of New System
- ✅ Single comprehensive script
- ✅ Better error handling
- ✅ Consistent logging
- ✅ Interactive mode available
- ✅ Complete schema validation
- ✅ Idempotent operations

## 🎯 Best Practices

1. **Always backup** before running database operations in production
2. **Test first** in a development environment
3. **Review logs** after each operation
4. **Use version control** for schema changes
5. **Document customizations** if you modify the scripts

## 📞 Support

If you encounter issues:

1. Check the error messages carefully
2. Verify your environment configuration
3. Review the troubleshooting section
4. Check Appwrite server status and version compatibility
5. Test with a minimal setup first

The database management system is designed to be robust and handle most scenarios automatically. The comprehensive logging will guide you through any issues that arise.
