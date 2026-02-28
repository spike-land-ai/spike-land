# Album API Endpoints

Complete reference for album management endpoints in the Spike Land API.

## Overview

The Album API provides endpoints for creating, managing, and enhancing image
albums. All protected endpoints require authentication via session cookie
(NextAuth.js).

**Base URL**:

- Production: `https://spike.land`
- Development: `http://localhost:3000`

## Authentication

All protected endpoints require a valid session. Authentication is handled via
NextAuth.js session cookies automatically included in requests.

### Making Authenticated Requests

**Browser/Frontend** (automatic):

```javascript
// Session cookie automatically included
const response = await fetch("/api/albums");
```

**cURL**:

```bash
curl -X GET http://localhost:3000/api/albums \
  -H "Cookie: next-auth.session-token=your_token_here"
```

---

## Endpoints

### GET /api/albums

List all albums belonging to the authenticated user.

**Authentication**: Required

**Request**:

```http
GET /api/albums HTTP/1.1
Host: localhost:3000
```

**cURL Example**:

```bash
curl -X GET http://localhost:3000/api/albums
```

**JavaScript Example**:

```javascript
const response = await fetch("/api/albums");
const { albums } = await response.json();

// Response contains array of albums with preview images
albums.forEach(album => {
  console.log(`${album.name}: ${album.imageCount} images`);
  album.previewImages.forEach(img => {
    console.log(`  - ${img.name}`);
  });
});
```

**Response** (200 OK):

```json
{
  "albums": [
    {
      "id": "clv8k9r9w000108jp5x4y5k8z",
      "name": "Vacation Photos",
      "description": "Summer 2024 memories",
      "privacy": "PRIVATE",
      "coverImageId": "img_001",
      "imageCount": 12,
      "previewImages": [
        {
          "id": "img_001",
          "url": "https://r2.example.com/original_001.jpg",
          "name": "Beach sunset"
        },
        {
          "id": "img_002",
          "url": "https://r2.example.com/original_002.jpg",
          "name": "Ocean view"
        }
      ],
      "createdAt": "2024-12-01T10:00:00Z",
      "updatedAt": "2024-12-10T15:45:00Z"
    }
  ]
}
```

**Error Responses**:

| Status | Error                  | Description       |
| ------ | ---------------------- | ----------------- |
| 401    | Unauthorized           | Not authenticated |
| 500    | Failed to fetch albums | Server error      |

---

### POST /api/albums

Create a new album.

**Authentication**: Required

**Request**:

```http
POST /api/albums HTTP/1.1
Content-Type: application/json

{
  "name": "Summer Vacation",
  "description": "Photos from our summer trip",
  "privacy": "PRIVATE"
}
```

**cURL Example**:

```bash
curl -X POST http://localhost:3000/api/albums \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Vacation",
    "description": "Photos from our summer trip",
    "privacy": "PRIVATE"
  }'
```

**JavaScript Example**:

```javascript
const response = await fetch("/api/albums", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Summer Vacation",
    description: "Photos from our summer trip",
    privacy: "PRIVATE",
  }),
});

const { album } = await response.json();
console.log(`Album created: ${album.id}`);
```

**Request Body**:

| Field       | Type   | Required | Constraints                                     |
| ----------- | ------ | -------- | ----------------------------------------------- |
| name        | string | Yes      | 1-100 characters                                |
| description | string | No       | Max 500 characters                              |
| privacy     | string | No       | PRIVATE, UNLISTED, or PUBLIC (default: PRIVATE) |

**Response** (200 OK):

```json
{
  "album": {
    "id": "clv8k9r9w000108jp5x4y5k8z",
    "name": "Summer Vacation",
    "description": "Photos from our summer trip",
    "privacy": "PRIVATE",
    "shareToken": null,
    "createdAt": "2024-12-10T15:45:00Z"
  }
}
```

**Error Responses**:

| Status | Error                                     | Description           |
| ------ | ----------------------------------------- | --------------------- |
| 400    | Album name is required                    | Name missing or empty |
| 400    | Album name must be 100 characters or less | Name too long         |
| 400    | Invalid privacy setting                   | Invalid privacy value |
| 401    | Unauthorized                              | Not authenticated     |
| 500    | Failed to create album                    | Server error          |

---

### GET /api/albums/{id}

Get a specific album with all images and details.

**Authentication**: Optional (public/unlisted albums accessible without auth)

**Request**:

```http
GET /api/albums/clv8k9r9w000108jp5x4y5k8z HTTP/1.1
Host: localhost:3000
```

**cURL Example**:

```bash
curl -X GET http://localhost:3000/api/albums/clv8k9r9w000108jp5x4y5k8z
```

**JavaScript Example**:

```javascript
const albumId = "clv8k9r9w000108jp5x4y5k8z";
const response = await fetch(`/api/albums/${albumId}`);
const { album } = await response.json();

console.log(`Album: ${album.name}`);
console.log(`Owner: ${album.isOwner ? "yes" : "no"}`);
console.log(`Images: ${album.imageCount}`);

album.images.forEach(img => {
  console.log(`  - ${img.name}: ${img.width}x${img.height}`);
  if (img.enhancedUrl) {
    console.log(`    Enhanced at ${img.enhancementTier}`);
  }
});
```

**Response** (200 OK):

```json
{
  "album": {
    "id": "clv8k9r9w000108jp5x4y5k8z",
    "name": "Summer Vacation",
    "description": "Photos from our summer trip",
    "privacy": "PRIVATE",
    "coverImageId": "img_001",
    "shareToken": "abc123def456",
    "imageCount": 3,
    "isOwner": true,
    "images": [
      {
        "id": "img_001",
        "name": "Beach",
        "description": "Sunset at the beach",
        "originalUrl": "https://r2.example.com/original_001.jpg",
        "enhancedUrl": "https://r2.example.com/enhanced_001.jpg",
        "enhancementTier": "TIER_2K",
        "width": 1920,
        "height": 1080,
        "sortOrder": 0,
        "createdAt": "2024-12-01T10:30:00Z"
      }
    ],
    "createdAt": "2024-12-01T10:00:00Z",
    "updatedAt": "2024-12-10T15:45:00Z"
  }
}
```

**Error Responses**:

| Status | Error                 | Description                           |
| ------ | --------------------- | ------------------------------------- |
| 404    | Album not found       | Album doesn't exist or not accessible |
| 500    | Failed to fetch album | Server error                          |

---

### PATCH /api/albums/{id}

Update album details. Only the album owner can update.

**Authentication**: Required

**Request**:

```http
PATCH /api/albums/clv8k9r9w000108jp5x4y5k8z HTTP/1.1
Content-Type: application/json

{
  "name": "Updated Album Name",
  "privacy": "UNLISTED",
  "coverImageId": "img_002"
}
```

**cURL Example**:

```bash
curl -X PATCH http://localhost:3000/api/albums/clv8k9r9w000108jp5x4y5k8z \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Album Name",
    "privacy": "UNLISTED"
  }'
```

**JavaScript Example**:

```javascript
const albumId = "clv8k9r9w000108jp5x4y5k8z";
const response = await fetch(`/api/albums/${albumId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Updated Album Name",
    privacy: "UNLISTED",
    coverImageId: "img_002",
  }),
});

const { album } = await response.json();
console.log(`Album updated: ${album.name}`);
console.log(`Share link: ${album.shareToken}`);
```

**Request Body** (all fields optional):

| Field        | Type   | Constraints                   |
| ------------ | ------ | ----------------------------- |
| name         | string | 1-100 characters              |
| description  | string | Max 500 characters            |
| privacy      | string | PRIVATE, UNLISTED, or PUBLIC  |
| coverImageId | string | Must be an image in the album |

**Response** (200 OK):

```json
{
  "album": {
    "id": "clv8k9r9w000108jp5x4y5k8z",
    "name": "Updated Album Name",
    "description": "Photos from our summer trip",
    "privacy": "UNLISTED",
    "coverImageId": "img_002",
    "shareToken": "abc123def456",
    "updatedAt": "2024-12-10T15:45:00Z"
  }
}
```

**Important Notes**:

- When changing privacy from PRIVATE to UNLISTED/PUBLIC, a share token is
  automatically generated if it doesn't exist
- When changing privacy to PRIVATE, the share token is removed
- The cover image must be an image that already exists in the album

**Error Responses**:

| Status | Error                                     | Description         |
| ------ | ----------------------------------------- | ------------------- |
| 400    | Album name must be 100 characters or less | Name too long       |
| 400    | Cover image must be in the album          | Image not in album  |
| 401    | Unauthorized                              | Not authenticated   |
| 403    | Forbidden                                 | Not the album owner |
| 404    | Album not found                           | Album doesn't exist |
| 500    | Failed to update album                    | Server error        |

---

### DELETE /api/albums/{id}

Delete an album and all associated images. Only the album owner can delete.

**Authentication**: Required

**Request**:

```http
DELETE /api/albums/clv8k9r9w000108jp5x4y5k8z HTTP/1.1
```

**cURL Example**:

```bash
curl -X DELETE http://localhost:3000/api/albums/clv8k9r9w000108jp5x4y5k8z
```

**JavaScript Example**:

```javascript
const albumId = "clv8k9r9w000108jp5x4y5k8z";
const response = await fetch(`/api/albums/${albumId}`, {
  method: "DELETE",
});

const { success } = await response.json();
if (success) {
  console.log("Album deleted");
}
```

**Response** (200 OK):

```json
{
  "success": true
}
```

**Warning**: This operation permanently deletes the album and all associated
images. This action cannot be undone.

**Error Responses**:

| Status | Error                  | Description         |
| ------ | ---------------------- | ------------------- |
| 401    | Unauthorized           | Not authenticated   |
| 403    | Forbidden              | Not the album owner |
| 404    | Album not found        | Album doesn't exist |
| 500    | Failed to delete album | Server error        |

---

### POST /api/albums/{id}/enhance

Batch enhance all images in an album with a specified enhancement tier.

**Authentication**: Required

**Request**:

```http
POST /api/albums/clv8k9r9w000108jp5x4y5k8z/enhance HTTP/1.1
Content-Type: application/json

{
  "tier": "TIER_2K",
  "skipAlreadyEnhanced": true
}
```

**cURL Example**:

```bash
curl -X POST http://localhost:3000/api/albums/clv8k9r9w000108jp5x4y5k8z/enhance \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "TIER_2K",
    "skipAlreadyEnhanced": true
  }'
```

**JavaScript Example**:

```javascript
const albumId = "clv8k9r9w000108jp5x4y5k8z";
const response = await fetch(`/api/albums/${albumId}/enhance`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tier: "TIER_2K",
    skipAlreadyEnhanced: true,
  }),
});

if (response.status === 402) {
  // Insufficient tokens
  const { required, toEnhance } = await response.json();
  console.log(
    `Need ${required} tokens to enhance ${toEnhance} images`,
  );
} else if (response.ok) {
  const { queued, totalCost, newBalance } = await response.json();
  console.log(`Queued ${queued} images for enhancement`);
  console.log(`Cost: ${totalCost} tokens`);
  console.log(`New balance: ${newBalance} tokens`);
}
```

**Request Body**:

| Field               | Type    | Required | Description                                               |
| ------------------- | ------- | -------- | --------------------------------------------------------- |
| tier                | string  | Yes      | TIER_1K, TIER_2K, or TIER_4K                              |
| skipAlreadyEnhanced | boolean | No       | Skip images already enhanced at this tier (default: true) |

**Enhancement Tiers**:

| Tier    | Tokens | Quality              |
| ------- | ------ | -------------------- |
| TIER_1K | 2      | Basic enhancement    |
| TIER_2K | 5      | Standard enhancement |
| TIER_4K | 10     | Premium enhancement  |

**Response** (200 OK):

```json
{
  "success": true,
  "totalImages": 5,
  "skipped": 2,
  "queued": 3,
  "totalCost": 15,
  "newBalance": 85,
  "jobs": [
    {
      "imageId": "img_001",
      "jobId": "album-clv8k9r9w000108jp5x4y5k8z-1702237500000"
    },
    {
      "imageId": "img_003",
      "jobId": "album-clv8k9r9w000108jp5x4y5k8z-1702237500000"
    },
    {
      "imageId": "img_005",
      "jobId": "album-clv8k9r9w000108jp5x4y5k8z-1702237500000"
    }
  ]
}
```

**Response Fields**:

| Field       | Type    | Description                            |
| ----------- | ------- | -------------------------------------- |
| success     | boolean | Whether batch was queued               |
| totalImages | integer | Total images in album                  |
| skipped     | integer | Images skipped (already enhanced)      |
| queued      | integer | Images queued for enhancement          |
| totalCost   | integer | Total tokens consumed                  |
| newBalance  | integer | User's token balance after consumption |
| jobs        | array   | List of queued enhancement jobs        |

**Important Notes**:

- Maximum 20 images per batch. Requests with more images will be rejected.
- Enhancement is asynchronous. Images will be enhanced in the background.
- Tokens are consumed immediately (upfront) when the batch is queued.
- If enhancement fails, tokens are refunded to the user.
- Skips already enhanced images by default (use `skipAlreadyEnhanced: false` to
  re-enhance).

**Error Responses**:

| Status | Error                     | Description                               |
| ------ | ------------------------- | ----------------------------------------- |
| 400    | Invalid tier              | Tier must be TIER_1K, TIER_2K, or TIER_4K |
| 400    | Maximum 20 images allowed | Batch size exceeds limit                  |
| 401    | Unauthorized              | Not authenticated                         |
| 402    | Insufficient tokens       | Not enough tokens for batch               |
| 403    | Forbidden                 | Not the album owner                       |
| 404    | Album not found           | Album doesn't exist                       |
| 404    | No images found in album  | Album is empty                            |
| 429    | Too many requests         | Rate limit exceeded                       |
| 500    | Server error              | Enhancement failed                        |

---

## Privacy Levels

Albums support three privacy levels:

### PRIVATE

- Only the owner can view the album
- No share token generated
- Most restrictive

### UNLISTED

- Accessible via share token (unlisted link)
- Anyone with the token can view without authentication
- Not discoverable in public search

### PUBLIC

- Accessible to anyone via direct link
- Share token included in responses
- May appear in public galleries

---

## Common Use Cases

### Scenario 1: Upload and Enhance an Album

```javascript
// 1. Create album
let res = await fetch("/api/albums", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Vacation Photos", privacy: "PRIVATE" }),
});
const { album } = await res.json();
const albumId = album.id;

// 2. Upload images via /api/images/upload (with albumId)
// See Image Upload documentation

// 3. Enhance all images
res = await fetch(`/api/albums/${albumId}/enhance`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ tier: "TIER_2K" }),
});

if (res.ok) {
  const { queued, totalCost } = await res.json();
  console.log(`Enhanced ${queued} images for ${totalCost} tokens`);
} else if (res.status === 402) {
  console.log("Need to purchase more tokens");
}
```

### Scenario 2: Share an Album

```javascript
const albumId = "clv8k9r9w000108jp5x4y5k8z";

// Make album unlisted to generate share token
const res = await fetch(`/api/albums/${albumId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ privacy: "UNLISTED" }),
});

const { album } = await res.json();
const shareUrl = `https://spike.land/apps/pixel/albums/${albumId}?token=${album.shareToken}`;
console.log(`Share this link: ${shareUrl}`);
```

### Scenario 3: Update Album Cover

```javascript
const albumId = "clv8k9r9w000108jp5x4y5k8z";
const coverImageId = "img_003";

const res = await fetch(`/api/albums/${albumId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ coverImageId }),
});

const { album } = await res.json();
console.log(`Cover updated to: ${album.coverImageId}`);
```

---

## Rate Limiting

Batch enhancement requests are rate limited to prevent abuse:

- **Limit**: 10 requests per minute per user
- **Status**: 429 Too Many Requests

---

## Testing with Postman

Import the OpenAPI specification (`docs/api/openapi.yaml`) into Postman:

1. Open Postman
2. Click "Import"
3. Select "Raw text"
4. Paste the OpenAPI YAML content
5. Click "Import"

The collection will include all endpoints with example requests and responses.

---

## Error Handling

All endpoints return error responses in this format:

```json
{
  "error": "Human-readable error message"
}
```

### Common HTTP Status Codes

| Code | Meaning          | Action                                |
| ---- | ---------------- | ------------------------------------- |
| 200  | Success          | Request completed successfully        |
| 400  | Bad Request      | Check request body and parameters     |
| 401  | Unauthorized     | Authenticate and retry                |
| 402  | Payment Required | Insufficient tokens (recharge needed) |
| 403  | Forbidden        | Not authorized for this resource      |
| 404  | Not Found        | Resource doesn't exist                |
| 429  | Rate Limited     | Wait and retry later                  |
| 500  | Server Error     | Contact support if persists           |

---

## API Versioning

This documentation covers API v1.0.0. The API uses semantic versioning. Breaking
changes will only be introduced in major version updates (v2.0.0, etc.).
