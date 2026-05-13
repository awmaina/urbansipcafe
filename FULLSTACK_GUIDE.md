# Urban Sip Café - Full-Stack Implementation Guide

## Overview

Urban Sip Café is a production-ready full-stack web application featuring a specialty coffee shop website with dynamic content management, file storage, and user authentication.

## Architecture

### Technology Stack

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- tRPC for type-safe API communication
- Sonner for toast notifications
- Framer Motion for animations

**Backend:**
- Express.js 4 for HTTP server
- tRPC 11 for RPC procedures
- Drizzle ORM for database queries
- MySQL/TiDB for data persistence
- AWS S3 for file storage

**Authentication:**
- Manus OAuth 2.0 integration
- Session-based authentication with JWT

## Database Schema

### Gallery Table

Stores metadata for uploaded café photos and media files:

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto-increment |
| title | VARCHAR(255) | Photo title |
| description | TEXT | Optional description |
| fileKey | VARCHAR(512) | S3 object key |
| fileUrl | TEXT | CDN URL to file |
| mimeType | VARCHAR(100) | File MIME type (e.g., image/jpeg) |
| fileSize | INT | File size in bytes |
| uploadedBy | INT | User ID of uploader |
| category | VARCHAR(100) | Category (interior, menu, events, staff, general) |
| isPublished | INT | 1 = published, 0 = draft |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Last update timestamp |

## API Procedures

### Gallery Router

#### `gallery.list`
**Type:** Public Query
**Input:**
```typescript
{
  limit: number (default: 20),
  offset: number (default: 0)
}
```
**Output:** Array of Gallery items
**Description:** Retrieves published gallery items with pagination

#### `gallery.upload`
**Type:** Protected Mutation (requires authentication)
**Input:**
```typescript
{
  title: string,
  description?: string,
  category: string (default: "general"),
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
}
```
**Output:** Gallery item with URL
**Description:** Uploads a file to S3 and creates gallery entry

#### `gallery.delete`
**Type:** Protected Mutation (requires authentication)
**Input:**
```typescript
{
  id: number
}
```
**Output:** `{ success: boolean }`
**Description:** Deletes a gallery item

## File Storage

### S3 Integration

Files are uploaded to S3 with the following key structure:
```
gallery/{userId}/{timestamp}-{fileName}
```

**Key Features:**
- Non-enumerable paths (random suffixes prevent directory listing)
- Public CDN URLs for fast image delivery
- Metadata stored in database for querying and authorization
- Automatic MIME type detection

### Usage Example

```typescript
// Frontend: Upload file
const uploadMutation = trpc.gallery.upload.useMutation();
await uploadMutation.mutateAsync({
  title: "Café Interior",
  description: "Main seating area",
  category: "interior",
  fileBuffer: Buffer.from(arrayBuffer),
  fileName: "interior.jpg",
  mimeType: "image/jpeg",
});

// Backend: storagePut helper
const { url } = await storagePut(fileKey, buffer, mimeType);
```

## Features

### Public Features
- **Menu System**: Filterable by category (Coffee, Food, Specials)
- **Loyalty Program**: Stamp collection with rewards
- **Reservations**: Date/time booking form
- **Gallery**: Browse café photos and atmosphere
- **Contact Information**: Hours, address, phone, email

### Authenticated Features
- **Photo Upload**: Add images to gallery
- **Photo Management**: Delete own uploads
- **Admin Access**: View all gallery items

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/gallery.test.ts

# Run with coverage
pnpm test -- --coverage
```

### Test Coverage

- **Unit Tests** (gallery.test.ts): 6 tests
  - List pagination
  - Upload validation
  - Delete operations
  - Authentication enforcement

- **Integration Tests** (gallery.integration.test.ts): 8 tests
  - Upload and retrieval flow
  - Error handling
  - Authentication and authorization
  - File metadata validation
  - MIME type support

- **Auth Tests** (auth.logout.test.ts): 1 test
  - Session cookie clearing

**Total: 15 tests passing**

## Deployment

### Environment Variables Required

```bash
DATABASE_URL=mysql://user:pass@host/db
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
```

### Build and Start

```bash
# Development
pnpm dev

# Production build
pnpm build

# Production start
pnpm start
```

## Frontend Components

### GalleryUpload
Modal dialog for authenticated users to upload photos
- File validation (size, type)
- Category selection
- Title and description fields

### GalleryDisplay
Grid display of published gallery items
- Responsive masonry layout
- Hover effects with metadata
- Delete button for item owners
- Pagination support

### Gallery Page
Full-featured gallery management page
- Navigation with upload button
- Gallery grid display
- Authentication-aware UI

## Database Queries

### Gallery Helpers (server/db.ts)

```typescript
// Add gallery item
addGalleryItem(item: InsertGallery): Promise<Gallery | null>

// Get published items with pagination
getGalleryItems(limit: number, offset: number): Promise<Gallery[]>

// Delete gallery item
deleteGalleryItem(id: number): Promise<boolean>
```

## Security Considerations

1. **Authentication**: All upload/delete operations require Manus OAuth login
2. **File Keys**: S3 keys include random suffixes to prevent enumeration
3. **MIME Type Validation**: Frontend and backend validate file types
4. **Size Limits**: 5MB file size limit enforced
5. **Database**: User ID tracked for authorization checks
6. **URLs**: CDN URLs are public but tied to authenticated uploads

## Future Enhancements

- [ ] Menu items database integration
- [ ] Reservation persistence to database
- [ ] Loyalty card progress tracking
- [ ] Image optimization and thumbnails
- [ ] Bulk upload functionality
- [ ] Gallery categories with filtering
- [ ] Admin dashboard for content management
- [ ] Email notifications for reservations
- [ ] Analytics and usage tracking

## Support

For issues or questions about the full-stack implementation:
1. Check the test files for usage examples
2. Review the tRPC procedures in `server/routers.ts`
3. Examine the component implementations in `client/src/components/`
4. Consult the Drizzle ORM documentation for database queries

## License

MIT
