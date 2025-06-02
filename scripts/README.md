# Database Setup Scripts

This directory contains scripts for managing your Appwrite database collections and schema.

## Complete Database Setup Script

The `complete-database-setup.js` script is a comprehensive tool that combines all database operations into a single script. It replaces the need to run multiple individual scripts.

### Features

- **Database Inspection**: View all collections, attributes, and permissions
- **Collection Creation**: Create all required collections with proper schema
- **Attribute Fixing**: Add missing attributes to existing collections
- **Permission Updates**: Set up proper permissions for all collections
- **Comprehensive Logging**: Detailed output showing what's happening at each step

### Usage

#### Using npm scripts (recommended):

```bash
# Complete database setup (recommended for first-time setup)
npm run db:setup

# Individual operations
npm run db:inspect     # Inspect database structure
npm run db:create      # Create collections only
npm run db:fix         # Fix missing attributes only
npm run db:permissions # Update permissions only
```

#### Direct node execution:

```bash
# Complete setup
node --experimental-modules scripts/complete-database-setup.js

# Or with specific commands
node --experimental-modules scripts/complete-database-setup.js inspect
node --experimental-modules scripts/complete-database-setup.js create
node --experimental-modules scripts/complete-database-setup.js fix
node --experimental-modules scripts/complete-database-setup.js permissions
```

### What the script does:

1. **Inspects** your current database state
2. **Creates** missing collections with full schema:
   - Users
   - Students  
   - Applications
   - Hostels
   - Rooms
   - Payments
   - Room Allocations
   - Settings

3. **Adds** any missing attributes to existing collections
4. **Creates** database indexes for optimal query performance
5. **Updates** collection permissions for proper access control
6. **Provides** a final summary of the database state

### Prerequisites

Make sure you have your `.env.local` file configured with:

```env
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-server-api-key
```

### Safety Features

- **Idempotent**: Safe to run multiple times
- **Non-destructive**: Won't delete existing data or collections
- **Error handling**: Continues processing even if individual operations fail
- **Detailed logging**: Shows exactly what's being created or updated

### Database Schema

The script creates collections with the following structure:

#### Users
- Display name, email, role, timestamps

#### Students  
- Registration number, name, gender, programme, contact info

#### Applications
- Student applications with status tracking and payment info

#### Hostels
- Hostel information, capacity, pricing, features

#### Rooms
- Room details, occupancy, availability, pricing

#### Payments
- Payment records, receipts, approval workflow

#### Room Allocations
- Student-room assignments with payment tracking

#### Settings
- System configuration and preferences

### Troubleshooting

If the script fails:

1. **Check your environment variables** in `.env.local`
2. **Verify API key permissions** - needs database create/update permissions
3. **Check network connectivity** to Appwrite endpoint
4. **Review error messages** - they usually indicate the specific issue

### Legacy Scripts

The individual scripts are still available but deprecated:

- `create-appwrite-collections.js` - Creates collections (replaced by db:create)
- `fix-collection-attributes.js` - Fixes attributes (replaced by db:fix)  
- `fix-hostel-attributes.js` - Fixes hostel attributes (included in db:fix)
- `inspect-database.js` - Inspects database (replaced by db:inspect)
- `update-collection-permissions.js` - Updates permissions (replaced by db:permissions)

**Recommendation**: Use the new `complete-database-setup.js` script for all database operations.
