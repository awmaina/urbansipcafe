# Urban Sip Café - API Documentation

## Base URL

```
/api/trpc
```

All requests use tRPC protocol with JSON-RPC 2.0 format.

## Authentication

Include credentials in requests:
```typescript
fetch('/api/trpc', {
  credentials: 'include', // Sends session cookie
})
```

## Gallery Endpoints

### List Gallery Items

**Endpoint:** `gallery.list`

**Type:** Query (GET-like)

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "query",
  "params": {
    "path": "gallery.list",
    "input": {
      "limit": 20,
      "offset": 0
    }
  },
  "id": 1
}
```

**Response (Success):**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "data": [
      {
        "id": 1,
        "title": "Café Interior",
        "description": "Main seating area",
        "fileUrl": "https://cdn.example.com/gallery/1/1712762400000-interior.jpg",
        "mimeType": "image/jpeg",
        "fileSize": 245632,
        "uploadedBy": 1,
        "category": "interior",
        "isPublished": 1,
        "createdAt": "2026-04-10T12:00:00.000Z",
        "updatedAt": "2026-04-10T12:00:00.000Z"
      }
    ]
  },
  "id": 1
}
```

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 20 | Maximum items to return |
| offset | number | 0 | Number of items to skip |

**Status Codes:**
- `200`: Success
- `400`: Invalid parameters

---

### Upload Photo

**Endpoint:** `gallery.upload`

**Type:** Mutation (POST-like)

**Authentication:** Required

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "mutation",
  "params": {
    "path": "gallery.upload",
    "input": {
      "title": "New Photo",
      "description": "Photo description",
      "category": "interior",
      "fileBuffer": "<Buffer data>",
      "fileName": "photo.jpg",
      "mimeType": "image/jpeg"
    }
  },
  "id": 1
}
```

**Response (Success):**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "data": {
      "id": 2,
      "title": "New Photo",
      "description": "Photo description",
      "fileUrl": "https://cdn.example.com/gallery/1/1712762500000-photo.jpg",
      "mimeType": "image/jpeg",
      "fileSize": 512000,
      "uploadedBy": 1,
      "category": "interior",
      "isPublished": 1,
      "createdAt": "2026-04-10T12:05:00.000Z",
      "updatedAt": "2026-04-10T12:05:00.000Z"
    }
  },
  "id": 1
}
```

**Response (Error - Not Authenticated):**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Please login (10001)"
  },
  "id": 1
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | Yes | Photo title (max 255 chars) |
| description | string | No | Optional description |
| category | string | No | Category: general, interior, menu, events, staff |
| fileBuffer | Buffer | Yes | File content as Buffer |
| fileName | string | Yes | Original filename |
| mimeType | string | Yes | MIME type (e.g., image/jpeg) |

**Constraints:**
- File size: ≤ 5MB
- Supported types: image/jpeg, image/png, image/webp, image/gif
- Title: Required, 1-255 characters

**Status Codes:**
- `200`: Success
- `400`: Validation error
- `401`: Not authenticated
- `413`: File too large
- `415`: Unsupported media type

---

### Delete Photo

**Endpoint:** `gallery.delete`

**Type:** Mutation (DELETE-like)

**Authentication:** Required

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "mutation",
  "params": {
    "path": "gallery.delete",
    "input": {
      "id": 2
    }
  },
  "id": 1
}
```

**Response (Success):**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "data": {
      "success": true
    }
  },
  "id": 1
}
```

**Response (Error - Not Authenticated):**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Please login (10001)"
  },
  "id": 1
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Gallery item ID |

**Status Codes:**
- `200`: Success (even if item not found)
- `401`: Not authenticated

---

## Authentication Endpoints

### Get Current User

**Endpoint:** `auth.me`

**Type:** Query

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "query",
  "params": {
    "path": "auth.me"
  },
  "id": 1
}
```

**Response (Authenticated):**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "data": {
      "id": 1,
      "openId": "user-123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  },
  "id": 1
}
```

**Response (Not Authenticated):**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "data": null
  },
  "id": 1
}
```

---

### Logout

**Endpoint:** `auth.logout`

**Type:** Mutation

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "mutation",
  "params": {
    "path": "auth.logout"
  },
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "data": {
      "success": true
    }
  },
  "id": 1
}
```

---

## Error Handling

### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Error message",
    "data": {
      "code": "ERROR_CODE",
      "httpStatus": 400
    }
  },
  "id": 1
}
```

### Common Error Codes

| Code | Message | HTTP Status | Description |
|------|---------|-------------|-------------|
| 10001 | Please login | 401 | Authentication required |
| 10002 | You do not have required permission | 403 | Authorization failed |
| -32603 | Internal server error | 500 | Server error |
| -32602 | Invalid params | 400 | Validation error |

---

## Rate Limiting

Currently no rate limiting is enforced. Future versions may implement:
- Per-user upload limits
- Request throttling
- Quota management

---

## CORS

CORS is configured to allow requests from the same origin. Cross-origin requests require proper CORS headers.

---

## Pagination

Gallery list supports cursor-based pagination:

```typescript
// First page
const page1 = await trpc.gallery.list.query({ limit: 20, offset: 0 });

// Next page
const page2 = await trpc.gallery.list.query({ limit: 20, offset: 20 });

// Check if more items exist
const hasMore = page1.length === 20;
```

---

## File Upload Best Practices

### Frontend Example

```typescript
import { trpc } from '@/lib/trpc';

// Read file
const file = event.target.files[0];
const arrayBuffer = await file.arrayBuffer();

// Upload via tRPC
const uploadMutation = trpc.gallery.upload.useMutation();
const result = await uploadMutation.mutateAsync({
  title: file.name,
  description: "User uploaded photo",
  category: "general",
  fileBuffer: Buffer.from(arrayBuffer),
  fileName: file.name,
  mimeType: file.type,
});

console.log("Uploaded to:", result.fileUrl);
```

### Backend Example

```typescript
import { storagePut } from "./server/storage";

// Upload to S3
const fileKey = `gallery/${userId}/${Date.now()}-${fileName}`;
const { url } = await storagePut(fileKey, buffer, mimeType);

// Save metadata to database
const item = await addGalleryItem({
  title,
  description,
  fileKey,
  fileUrl: url,
  mimeType,
  fileSize: buffer.length,
  uploadedBy: userId,
  category,
  isPublished: 1,
});
```

---

## Versioning

API version: 1.0.0

Changes will be documented in CHANGELOG.md
