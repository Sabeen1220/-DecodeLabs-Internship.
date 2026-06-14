# RoamKPK Backend API
### Project 2 – DecodeLabs Industrial Training | Batch 2026

---

## How to Run

**Requirements:** Node.js installed (no npm packages needed)

```bash
node server.js
```

Server starts at: **http://localhost:3000**

---

## All API Endpoints

### GET Endpoints (Read Data)

| Endpoint | Description |
|---|---|
| `GET /` | API welcome page + all endpoint list |
| `GET /api/status` | Health check – is the server alive? |
| `GET /api/tours` | Get all 6 tours |
| `GET /api/tours?category=adventure` | Filter tours by category |
| `GET /api/tours/1` | Get a single tour by ID |
| `GET /api/bookings` | Get all submitted bookings |

### POST Endpoints (Send Data)

| Endpoint | Description |
|---|---|
| `POST /api/bookings` | Submit a new tour booking |
| `POST /api/contact` | Submit a contact/enquiry form |

---

## POST /api/bookings – Required Fields

```json
{
  "firstName":  "Ahmad",
  "lastName":   "Khan",
  "email":      "ahmad@gmail.com",
  "phone":      "03001234567",
  "tourId":     1,
  "groupSize":  2,
  "travelDate": "2025-08-15",
  "message":    "Optional message"
}
```

## POST /api/contact – Required Fields

```json
{
  "name":    "Sara Noor",
  "email":   "sara@gmail.com",
  "phone":   "03009876543",
  "message": "I want to know more about the Swat tour."
}
```

---

## HTTP Status Codes Used (as per DecodeLabs PDF)

| Code | Meaning | When Used |
|---|---|---|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST (booking/contact created) |
| 400 | Bad Request | Validation failed / wrong data |
| 404 | Not Found | Tour ID doesn't exist / wrong URL |
| 500 | Internal Error | Unexpected server crash |

---

## Technologies Used

- **Node.js** – Runtime (built-in `http` and `url` modules only)
- **No frameworks** – Pure Node.js to demonstrate core API concepts
- **JSON** – Data format for all requests and responses
- **RESTful naming** – `/api/tours`, `/api/bookings` (nouns, not verbs)
- **CORS headers** – So the frontend HTML file can call this API

---

*Built for DecodeLabs Project 2 – Backend API Development*
