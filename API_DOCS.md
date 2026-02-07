# Linkpop REST API Documentation

Base URL: `https://linkpop.space`

## Overview
Linkpop REST API allows programmatic management of user accounts, short links, bio links, and profiles. All endpoints support Bearer token authentication for AI agents and automated tools.

---

## Authentication

### 1. Create Account (Signup)
**POST** `/api/auth/signup`

Create a new Linkpop account programmatically.

**Request:**
```bash
curl -X POST https://linkpop.space/api/auth/signup \
-H "Content-Type: application/json" \
-d '{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "johndoe"
}'
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "johndoe"
}
```

**Validation Rules:**
- Email: Valid email format
- Password: 8-100 characters
- Username: 3-30 characters, letters/numbers/hyphens/underscores only

**Success Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "display_name": null,
    "bio": null,
    "avatar_url": null,
    "theme": "light",
    "created_at": "2025-01-29T...",
    "updated_at": "2025-01-29T..."
  },
  "token": "your-session-token-here"
}
```

**Error Responses:**
- `400`: Validation error or user already exists
- `429`: Rate limit exceeded (20 requests/minute)

---

### 2. Login
**POST** `/api/auth/login`

Login to get an authentication token.

**Request:**
```bash
curl -X POST https://linkpop.space/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "user@example.com",
  "password": "securepassword123"
}'
```

**Success Response (200):**
```json
{
  "user": {...},
  "token": "your-session-token-here"
}
```

**Error Response:**
- `401`: Invalid credentials

---

### 3. Get Current User
**GET** `/api/auth/me`

Get the currently authenticated user's information.

**Request:**
```bash
curl -X GET https://linkpop.space/api/auth/me \
-H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "display_name": "John Doe",
    "bio": "My bio",
    "avatar_url": "https://...",
    "custom_domain": null,
    "root_domain_mode": "bio",
    "root_domain_redirect_url": null,
    "use_domain_for_shortlinks": true
  }
}
```

---

## Short Links Management

### 4. Create Short Link
**POST** `/api/urls`

Create a new short link.

**Request:**
```bash
curl -X POST https://linkpop.space/api/urls \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "originalUrl": "https://example.com/very/long/url",
  "customCode": "mylink",
  "title": "My Example Link"
}'
```

**Request Body:**
```json
{
  "originalUrl": "https://example.com/very/long/url",
  "customCode": "mylink",
  "title": "My Example Link"
}
```

**Fields:**
- `originalUrl` (required): The URL to shorten
- `customCode` (optional): Custom short code (3-50 chars, alphanumeric/hyphens/underscores)
- `title` (optional): Title for the link

**Success Response (201):**
```json
{
  "url": {
    "id": "uuid",
    "short_code": "mylink",
    "original_url": "https://example.com/very/long/url",
    "title": "My Example Link",
    "clicks": 0,
    "user_id": "uuid",
    "created_at": "2025-01-29T...",
    "updated_at": "2025-01-29T..."
  }
}
```

**Short URL:** `https://linkpop.space/mylink` or `https://johndoe.linkpop.space/mylink`

**Error Responses:**
- `400`: Invalid URL or custom code already taken
- `401`: Not authenticated

---

### 5. Get All Short Links
**GET** `/api/urls`

Get all short links for the authenticated user.

**Request:**
```bash
curl -X GET https://linkpop.space/api/urls \
-H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "urls": [
    {
      "id": "uuid",
      "short_code": "mylink",
      "original_url": "https://example.com",
      "title": "My Link",
      "clicks": 42,
      "created_at": "2025-01-29T..."
    }
  ]
}
```

---

### 6. Update Short Link
**PATCH** `/api/urls/[id]`

Update an existing short link.

**Request:**
```bash
curl -X PATCH https://linkpop.space/api/urls/YOUR_LINK_ID \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "originalUrl": "https://newurl.com",
  "title": "Updated Title"
}'
```

**Request Body:**
```json
{
  "originalUrl": "https://newurl.com",
  "title": "Updated Title"
}
```

**Success Response (200):**
```json
{
  "url": {
    "id": "uuid",
    "short_code": "mylink",
    "original_url": "https://newurl.com",
    "title": "Updated Title",
    "clicks": 42
  }
}
```

---

### 7. Delete Short Link
**DELETE** `/api/urls/[id]`

Delete a short link.

**Request:**
```bash
curl -X DELETE https://linkpop.space/api/urls/YOUR_LINK_ID \
-H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "message": "URL deleted successfully"
}
```

---

## Bio Links Management

### 8. Create Bio Link
**POST** `/api/bio-links`

Create a new bio link for your profile page.

**Request:**
```bash
curl -X POST https://linkpop.space/api/bio-links \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "title": "My Instagram",
  "url": "https://instagram.com/myprofile",
  "block_type": "link",
  "is_visible": true
}'
```

**Request Body:**
```json
{
  "title": "My Instagram",
  "url": "https://instagram.com/myprofile",
  "block_type": "link",
  "is_visible": true
}
```

**Block Types:**
- `link`: Standard clickable link
- `header`: Text header (no URL needed)
- `text`: Text block (no URL needed)

**Success Response (201):**
```json
{
  "bioLink": {
    "id": "uuid",
    "title": "My Instagram",
    "url": "https://instagram.com/myprofile",
    "block_type": "link",
    "is_visible": true,
    "position": 0,
    "user_id": "uuid",
    "created_at": "2025-01-29T..."
  }
}
```

---

### 9. Get All Bio Links
**GET** `/api/bio-links`

Get all bio links for the authenticated user.

**Request:**
```bash
curl -X GET https://linkpop.space/api/bio-links \
-H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "bioLinks": [
    {
      "id": "uuid",
      "title": "My Instagram",
      "url": "https://instagram.com/myprofile",
      "block_type": "link",
      "is_visible": true,
      "position": 0
    }
  ]
}
```

---

### 10. Update Bio Link
**PATCH** `/api/bio-links/[id]`

Update an existing bio link.

**Request:**
```bash
curl -X PATCH https://linkpop.space/api/bio-links/YOUR_LINK_ID \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "title": "Updated Title",
  "url": "https://newurl.com",
  "is_visible": false
}'
```

**Success Response (200):**
```json
{
  "bioLink": {
    "id": "uuid",
    "title": "Updated Title",
    "url": "https://newurl.com",
    "is_visible": false
  }
}
```

---

### 11. Delete Bio Link
**DELETE** `/api/bio-links/[id]`

Delete a bio link.

**Request:**
```bash
curl -X DELETE https://linkpop.space/api/bio-links/YOUR_LINK_ID \
-H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "message": "Bio link deleted successfully"
}
```

---

### 12. Reorder Bio Links
**POST** `/api/bio-links/reorder`

Change the order of bio links on your profile.

**Request:**
```bash
curl -X POST https://linkpop.space/api/bio-links/reorder \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "bioLinkIds": ["id1", "id2", "id3"]
}'
```

**Request Body:**
```json
{
  "bioLinkIds": ["id1", "id2", "id3"]
}
```

**Success Response (200):**
```json
{
  "message": "Bio links reordered successfully"
}
```

---

## Profile Management

### 13. Update Profile
**PATCH** `/api/profile`

Update user profile information.

**Request:**
```bash
curl -X PATCH https://linkpop.space/api/profile \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "display_name": "John Doe",
  "bio": "Software developer and creator",
  "theme": "dark"
}'
```

**Request Body (all fields optional):**
```json
{
  "display_name": "John Doe",
  "bio": "Software developer and creator",
  "theme": "dark",
  "background_type": "gradient",
  "background_value": "#FF6B6B,#4ECDC4",
  "font_family": "inter",
  "button_style": "rounded"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "display_name": "John Doe",
    "bio": "Software developer and creator",
    "theme": "dark"
  }
}
```

---

## Analytics & Insights

### 14. Get URL Analytics
**GET** `/api/insights/shortlinks/[id]`

Get detailed analytics for a specific short link.

**Request:**
```bash
curl -X GET https://linkpop.space/api/insights/shortlinks/YOUR_LINK_ID \
-H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "url": {
    "id": "uuid",
    "short_code": "mylink",
    "original_url": "https://example.com",
    "clicks": 42
  },
  "analytics": {
    "total_clicks": 42,
    "unique_visitors": 28,
    "clicks_by_date": [...],
    "top_countries": [...],
    "top_referrers": [...]
  }
}
```

---

### 15. Get All Shortlinks Analytics
**GET** `/api/insights/shortlinks`

Get analytics summary for all short links.

**Request:**
```bash
curl -X GET https://linkpop.space/api/insights/shortlinks \
-H "Authorization: Bearer YOUR_TOKEN"
```

---

### 16. Get Overall Dashboard Insights
**GET** `/api/insights`

Get overall statistics for the user's account.

**Request:**
```bash
curl -X GET https://linkpop.space/api/insights \
-H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "total_clicks": 1234,
  "total_urls": 42,
  "total_bio_links": 8,
  "profile_views": 567,
  "clicks_trend": [...]
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Access denied |
| 404 | Not Found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limits

- Signup: 20 requests per minute per IP
- Other endpoints: No strict limit (subject to fair use)

---

## Authentication Header Format

All protected endpoints require the Authorization header:

```
Authorization: Bearer YOUR_SESSION_TOKEN
```

Get your token from `/api/auth/signup` or `/api/auth/login` responses.

---

## Common Workflows

### Create Account + First Short Link
```bash
# 1. Create account
TOKEN=$(curl -X POST https://linkpop.space/api/auth/signup \
-H "Content-Type: application/json" \
-d '{"email":"user@example.com","password":"pass123","username":"myuser"}' \
| jq -r '.token')

# 2. Create short link
curl -X POST https://linkpop.space/api/urls \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{"originalUrl":"https://example.com","customCode":"first"}'
```

### Build Bio Page
```bash
# 1. Login
TOKEN=$(curl -X POST https://linkpop.space/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"user@example.com","password":"pass123"}' \
| jq -r '.token')

# 2. Update profile
curl -X PATCH https://linkpop.space/api/profile \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{"display_name":"John Doe","bio":"Creator"}'

# 3. Add bio links
curl -X POST https://linkpop.space/api/bio-links \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{"title":"Instagram","url":"https://instagram.com/me","block_type":"link"}'

curl -X POST https://linkpop.space/api/bio-links \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{"title":"YouTube","url":"https://youtube.com/@me","block_type":"link"}'
```

---

## Support

For issues or questions:
- GitHub: [Your repo URL]
- Email: support@linkpop.space

---

**Last Updated:** January 29, 2025
