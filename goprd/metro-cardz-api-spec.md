# Metro Cardz — API Specification

**Base URL:** `https://metrocardz.in/api`
**Format:** JSON request/response
**Auth:** Admin routes require a valid session cookie (NextAuth) or Bearer JWT

---

## Public Endpoints

### `GET /api/categories`
Returns all active categories.

**Response 200**
```json
[
  { "id": 1, "name": "Water Parks", "slug": "waterparks" },
  { "id": 2, "name": "Restaurants", "slug": "restaurants" }
]
```

---

### `GET /api/cities`
Returns all cities.

**Response 200**
```json
[
  { "id": 1, "name": "Mumbai", "slug": "mumbai" },
  { "id": 2, "name": "Lonavala", "slug": "lonavala" }
]
```

---

### `GET /api/deals`
Returns active deals, optionally filtered.

**Query params**
| Param | Type | Required | Description |
|---|---|---|---|
| `category` | string | no | category slug |
| `city` | string | no | city slug |
| `featured` | boolean | no | true = only featured deals |

**Response 200**
```json
[
  {
    "id": 101,
    "brand": {
      "name": "Imagicaa",
      "logo_url": "https://.../imagicaa.png",
      "partner_status": "authorised_partner"
    },
    "offer_title": "20% off weekday tickets",
    "offer_percentage": 20,
    "offer_type": "percentage",
    "city": "Mumbai",
    "category": "waterparks",
    "featured": true
  }
]
```

---

### `GET /api/deals/:id`
Returns full detail for a single deal.

**Response 200**
```json
{
  "id": 101,
  "brand": {
    "name": "Imagicaa",
    "logo_url": "https://.../imagicaa.png",
    "website": "https://imagicaa.com",
    "phone": "+91XXXXXXXXXX",
    "maps_url": "https://maps.google.com/...",
    "partner_status": "authorised_partner"
  },
  "offer_title": "20% off weekday tickets",
  "offer_percentage": 20,
  "offer_type": "percentage",
  "start_date": "2026-09-01",
  "end_date": "2026-10-31",
  "terms": "Valid Mon-Fri excluding holidays.",
  "last_verified_date": "2026-09-10",
  "booking_url": "https://imagicaa.com/tickets",
  "affiliate_url": null
}
```

**Response 404** — deal not found or inactive

---

### `GET /api/redirect/:id`
Server-side redirect endpoint. Logs the click event (optional, phase 2) and issues a 302 to the correct outbound URL based on `partner_status`.

**Behavior**
- If `affiliate_url` is set → redirect there (with tracking params if required by the affiliate program)
- Else → redirect to `booking_url`
- If neither exists → redirect to `website`

**Response** 302 redirect (no body)

---

## Admin Endpoints (session-protected)

### `POST /api/admin/auth`
Login.

**Request**
```json
{ "email": "admin@metrocardz.in", "password": "••••••" }
```

**Response 200** — sets session cookie
**Response 401** — invalid credentials

---

### `GET /api/admin/deals`
Returns all deals (including inactive/expired), for the admin table view.

**Response 200** — array of full deal objects (same shape as `/api/deals/:id` but includes `active`, `created_at`)

---

### `POST /api/admin/deals`
Create a new deal.

**Request**
```json
{
  "brand_id": 12,
  "offer_title": "Buy 1 Get 1 on mains",
  "offer_percentage": null,
  "offer_type": "bogo",
  "start_date": "2026-09-20",
  "end_date": "2026-12-31",
  "booking_url": "https://brandsite.com",
  "affiliate_url": null,
  "terms": "Dine-in only.",
  "featured": false,
  "active": true
}
```

**Validation rules (server-side, non-negotiable)**
- `brand_id` must reference an existing brand with a `partner_status` set
- If the brand's `partner_status = affiliate`, `affiliate_url` is required on the deal
- `end_date` must be ≥ `start_date`

**Response 201** — created deal object
**Response 400** — validation error, with field-level messages

---

### `PUT /api/admin/deals/:id`
Update an existing deal. Same validation rules as create.

**Response 200** — updated deal object
**Response 404** — deal not found

---

### `DELETE /api/admin/deals/:id`
Soft-delete (sets `active = false`) — deals are never hard-deleted, to preserve historical reporting.

**Response 200**

---

### `GET /api/admin/brands` / `POST /api/admin/brands` / `PUT /api/admin/brands/:id`
Same CRUD pattern as deals. `partner_status` is a required enum field on every create/update — reject the request if omitted.

**Enum values:** `public_link` | `affiliate` | `authorised_partner` | `direct_merchant`

---

## Error Format (all endpoints)

```json
{
  "error": true,
  "message": "affiliate_url is required when partner_status is 'affiliate'",
  "field": "affiliate_url"
}
```
