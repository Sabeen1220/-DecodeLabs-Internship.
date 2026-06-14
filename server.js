// ============================================================
//  RoamKPK Backend API Server
//  Built with: Pure Node.js (no frameworks needed)
//  Project 2 – DecodeLabs Industrial Training | Batch 2026
// ============================================================

const http = require("http");
const url  = require("url");

const PORT = 3000;

// ── In-Memory "Database" (no DB yet — pure API logic) ──────
let tours = [
  { id: 1, name: "DI Khan Heritage Trail",       category: "cultural",   duration: "2 Days", price: 8500,  slots: 10 },
  { id: 2, name: "Swat Valley & Mahodand Lake",  category: "nature",     duration: "5 Days", price: 22000, slots: 8  },
  { id: 3, name: "Chitral & Kalash Valley Trek", category: "adventure",  duration: "4 Days", price: 18000, slots: 6  },
  { id: 4, name: "Indus River Expedition",        category: "nature",     duration: "3 Days", price: 12500, slots: 15 },
  { id: 5, name: "Peshawar Old City Tour",        category: "cultural",   duration: "3 Days", price: 14000, slots: 12 },
  { id: 6, name: "Dir & Kumrat Valley Wilderness",category: "adventure",  duration: "7 Days", price: 28000, slots: 5  },
];

let bookings = [];
let contacts = [];
let nextBookingId = 1;
let nextContactId = 1;

// ── Helpers ─────────────────────────────────────────────────

// Build a JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",           // Allow frontend to call this API
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data, null, 2));
}

// Read the request body (for POST requests)
function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch (e) { reject(new Error("Invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

// Simple field validator
function validate(fields, data) {
  const errors = [];
  for (const [field, rules] of Object.entries(fields)) {
    const value = data[field];
    if (rules.required && (value === undefined || value === null || value === "")) {
      errors.push(`'${field}' is required`);
      continue;
    }
    if (value !== undefined && value !== "") {
      if (rules.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        errors.push(`'${field}' must be a valid email address`);
      if (rules.type === "number" && isNaN(Number(value)))
        errors.push(`'${field}' must be a number`);
      if (rules.minLen && String(value).length < rules.minLen)
        errors.push(`'${field}' must be at least ${rules.minLen} characters`);
      if (rules.maxLen && String(value).length > rules.maxLen)
        errors.push(`'${field}' must be at most ${rules.maxLen} characters`);
      if (rules.min && Number(value) < rules.min)
        errors.push(`'${field}' must be at least ${rules.min}`);
    }
  }
  return errors;
}

// Timestamp helper
function now() { return new Date().toISOString(); }

// ── Router ───────────────────────────────────────────────────
async function router(req, res) {
  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname.replace(/\/$/, "") || "/";
  const query    = parsed.query;
  const method   = req.method.toUpperCase();

  // Handle CORS preflight (OPTIONS)
  if (method === "OPTIONS") {
    sendJSON(res, 200, {});
    return;
  }

  console.log(`[${now()}]  ${method}  ${pathname}`);

  // ── ROOT ────────────────────────────────────────────────
  // GET /
  if (pathname === "/" && method === "GET") {
    sendJSON(res, 200, {
      status: "success",
      message: "Welcome to the RoamKPK API!",
      version: "1.0.0",
      developer: "DecodeLabs Industrial Training – Project 2",
      endpoints: {
        "GET  /api/tours":              "Get all tours (optional: ?category=adventure)",
        "GET  /api/tours/:id":          "Get a single tour by ID",
        "GET  /api/bookings":           "Get all bookings",
        "POST /api/bookings":           "Create a new booking",
        "POST /api/contact":            "Submit a contact / enquiry form",
        "GET  /api/status":             "API health check",
      },
    });
    return;
  }

  // ── HEALTH CHECK ────────────────────────────────────────
  // GET /api/status
  if (pathname === "/api/status" && method === "GET") {
    sendJSON(res, 200, {
      status: "success",
      message: "RoamKPK API is running perfectly!",
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: now(),
      total_tours: tours.length,
      total_bookings: bookings.length,
      total_contacts: contacts.length,
    });
    return;
  }

  // ── TOURS ────────────────────────────────────────────────
  // GET /api/tours   (optional filter: ?category=adventure)
  if (pathname === "/api/tours" && method === "GET") {
    let result = [...tours];

    // Filter by category if provided
    if (query.category) {
      result = result.filter(t => t.category === query.category.toLowerCase());
      if (result.length === 0) {
        sendJSON(res, 404, {
          status: "error",
          code: 404,
          message: `No tours found for category: '${query.category}'`,
        });
        return;
      }
    }

    sendJSON(res, 200, {
      status: "success",
      count: result.length,
      data: result,
    });
    return;
  }

  // GET /api/tours/:id
  const tourMatch = pathname.match(/^\/api\/tours\/(\d+)$/);
  if (tourMatch && method === "GET") {
    const id   = parseInt(tourMatch[1]);
    const tour = tours.find(t => t.id === id);

    if (!tour) {
      sendJSON(res, 404, {
        status: "error",
        code: 404,
        message: `Tour with ID ${id} not found`,
      });
      return;
    }

    sendJSON(res, 200, { status: "success", data: tour });
    return;
  }

  // ── BOOKINGS ─────────────────────────────────────────────
  // GET /api/bookings
  if (pathname === "/api/bookings" && method === "GET") {
    sendJSON(res, 200, {
      status: "success",
      count: bookings.length,
      data: bookings,
    });
    return;
  }

  // POST /api/bookings
  if (pathname === "/api/bookings" && method === "POST") {
    let body;
    try { body = await getBody(req); }
    catch (e) {
      sendJSON(res, 400, { status: "error", code: 400, message: "Invalid JSON. Please send valid JSON data." });
      return;
    }

    // ── Validation (The Gatekeeper Rule – Never Trust the Client)
    const errors = validate({
      firstName:  { required: true,  minLen: 2, maxLen: 50  },
      lastName:   { required: true,  minLen: 2, maxLen: 50  },
      email:      { required: true,  type: "email"          },
      phone:      { required: true,  minLen: 10             },
      tourId:     { required: true,  type: "number"         },
      groupSize:  { required: true,  type: "number", min: 1 },
      travelDate: { required: true                          },
    }, body);

    if (errors.length > 0) {
      sendJSON(res, 400, {
        status: "error",
        code: 400,
        message: "Validation failed. Please fix the errors below.",
        errors: errors,
      });
      return;
    }

    // Check if tour exists
    const tour = tours.find(t => t.id === parseInt(body.tourId));
    if (!tour) {
      sendJSON(res, 404, {
        status: "error",
        code: 404,
        message: `Tour with ID ${body.tourId} does not exist`,
      });
      return;
    }

    // Check available slots
    if (tour.slots < parseInt(body.groupSize)) {
      sendJSON(res, 400, {
        status: "error",
        code: 400,
        message: `Not enough slots. Only ${tour.slots} slots available for this tour.`,
      });
      return;
    }

    // Create booking
    const booking = {
      id:          nextBookingId++,
      firstName:   body.firstName.trim(),
      lastName:    body.lastName.trim(),
      email:       body.email.trim().toLowerCase(),
      phone:       body.phone.trim(),
      tourId:      parseInt(body.tourId),
      tourName:    tour.name,
      groupSize:   parseInt(body.groupSize),
      travelDate:  body.travelDate,
      message:     body.message ? body.message.trim() : "",
      totalPrice:  tour.price * parseInt(body.groupSize),
      status:      "confirmed",
      bookedAt:    now(),
    };

    // Update available slots
    tour.slots -= booking.groupSize;

    bookings.push(booking);

    // 201 Created — as taught in the PDF
    sendJSON(res, 201, {
      status: "success",
      code: 201,
      message: "Booking confirmed! We will contact you on WhatsApp shortly.",
      data: booking,
    });
    return;
  }

  // ── CONTACT FORM ─────────────────────────────────────────
  // POST /api/contact
  if (pathname === "/api/contact" && method === "POST") {
    let body;
    try { body = await getBody(req); }
    catch (e) {
      sendJSON(res, 400, { status: "error", code: 400, message: "Invalid JSON body" });
      return;
    }

    // Validation
    const errors = validate({
      name:    { required: true,  minLen: 2, maxLen: 100 },
      email:   { required: true,  type: "email"          },
      message: { required: true,  minLen: 10, maxLen: 1000 },
    }, body);

    if (errors.length > 0) {
      sendJSON(res, 400, {
        status: "error",
        code: 400,
        message: "Validation failed",
        errors: errors,
      });
      return;
    }

    const contact = {
      id:          nextContactId++,
      name:        body.name.trim(),
      email:       body.email.trim().toLowerCase(),
      phone:       body.phone ? body.phone.trim() : "",
      message:     body.message.trim(),
      submittedAt: now(),
    };

    contacts.push(contact);

    sendJSON(res, 201, {
      status: "success",
      code: 201,
      message: "Thank you! Your message has been received. We'll reply within 24 hours.",
      data: { id: contact.id, name: contact.name, email: contact.email },
    });
    return;
  }

  // ── 404 – Route Not Found ────────────────────────────────
  sendJSON(res, 404, {
    status: "error",
    code: 404,
    message: `Route '${method} ${pathname}' not found`,
    hint: "Visit GET / to see all available endpoints",
  });
}

// ── Start Server ─────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  try {
    await router(req, res);
  } catch (err) {
    // 500 Internal Server Error
    console.error("Server Error:", err.message);
    sendJSON(res, 500, {
      status: "error",
      code: 500,
      message: "Internal Server Error",
      detail: err.message,
    });
  }
});

server.listen(PORT, () => {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║       RoamKPK Backend API – Running!         ║");
  console.log(`║   Server: http://localhost:${PORT}               ║`);
  console.log("║   Project 2 – DecodeLabs | Batch 2026        ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log("\nAvailable Endpoints:");
  console.log("  GET  /                → API info");
  console.log("  GET  /api/status      → Health check");
  console.log("  GET  /api/tours       → All tours");
  console.log("  GET  /api/tours/:id   → Single tour");
  console.log("  GET  /api/bookings    → All bookings");
  console.log("  POST /api/bookings    → Create booking");
  console.log("  POST /api/contact     → Contact form\n");
});
