# RYDO — Full-Stack Ride Booking Platform

> **"Move Smarter. Ride Better."**

**RYDO** is a production-structured, full-stack ride-booking software platform engineered with modern cloud architecture. It provides an end-to-end ride hailing lifecycle: interactive mapping, dynamic multi-tier fare estimation, driver dispatch and proximity matching, real-time WebSockets, passenger security verification PINs (OTP), live route simulation, digital payments ledger, 5-star ratings, and executive administrative telemetry.

---

## 🚀 Key Highlights & Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │                 CLIENT TIER                  │
                               │        React + TypeScript + Vite + Tailwind  │
                               │      (Passenger App | Driver App | Admin)    │
                               └──────────────┬────────────────────────┬──────┘
                                              │ REST (Axios)           │ WebSockets
                                              ▼                        ▼
                               ┌──────────────────────────────────────────────┐
                               │                 API TIER                     │
                               │           FastAPI + Pydantic v2              │
                               │  ├── Auth & JWT Guard (RBAC)                 │
                               │  ├── Rides & Dispatch Engine                 │
                               │  ├── Dynamic Fare & Surge Engine             │
                               │  ├── Driver Proximity Locator                │
                               │  └── WebSocket Event Connection Manager      │
                               └──────────────────────┬───────────────────────┘
                                                      │ SQLAlchemy ORM
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │               PERSISTENCE TIER               │
                               │            PostgreSQL / SQLite               │
                               │ (Users, Drivers, Rides, Payments, Ratings)   │
                               └──────────────────────────────────────────────┘
```

- **Interactive OpenStreetMap + Leaflet**: Zero paid API keys required. Full pan/zoom, interactive click-to-pin, custom vehicle icons, route lines, and city presets.
- **Dynamic Multi-Tier Fare Estimation**: Automatic calculation of distance (Haversine formula + urban road curvature factor) and time for 4 tiers:
  - **RYDO Go**: Affordable compact cars for everyday travel.
  - **RYDO Comfort**: Newer, spacious sedans with top-rated drivers.
  - **RYDO XL**: Spacious SUVs for up to 6 passengers or extra luggage.
  - **RYDO Premium**: High-end luxury vehicles and chauffeur service.
- **Real-Time WebSockets (`/ws`)**: Instant push updates for ride dispatches, driver acceptance, arrival alerts, turn-by-turn route progress, and live cancellation broadcasts.
- **Passenger Security PIN (OTP)**: 4-digit code generated upon booking; driver must verify the PIN before the trip can transition to `IN_PROGRESS`.
- **Financial Settlement Ledger**: 20% platform commission and 80% driver payout split recorded into `payments` table with unique transaction IDs (`TXN-...`).
- **Post-Trip Review & Confetti**: Interactive 5-star rating with compliment tags and celebratory animations.
- **Admin Control Center**: Live operations map, Gross Merchandise Value (GMV), net platform revenue, active trips, and driver verification controls.
- **Zero-Friction 1-Click Demo Login**: Pre-seeded demo credentials and 1-click role switcher directly on the login screen to test all 3 roles simultaneously.

---

## 📂 Repository Structure

```
RYDO/
├── backend/
│   ├── app/
│   │   ├── auth/           # JWT creation, password hashing & RBAC guards
│   │   ├── models/         # SQLAlchemy models (User, DriverProfile, Ride, Payment, Rating)
│   │   ├── routers/        # FastAPI endpoints (auth, rides, drivers, admin, ws)
│   │   ├── schemas/        # Pydantic v2 validation models
│   │   ├── services/       # Fare calculator, driver dispatch, route interpolation
│   │   ├── websocket/      # Connection manager for real-time WebSocket broadcasting
│   │   ├── config.py       # Configuration and settings
│   │   ├── database.py     # SQLAlchemy engine & session factory
│   │   ├── main.py         # Application entry point & lifespan
│   │   └── seed.py         # Database seeding script
│   ├── requirements.txt    # Python dependencies
│   └── test_backend.py     # Automated integration test suite
│
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios API client with automatic JWT injection
│   │   ├── components/     # LiveMap, FareCard, RideStatusBadge, RatingModal, SafetyModal, Navbar
│   │   ├── context/        # AuthContext (session & demo logins) and SocketContext (WebSockets)
│   │   ├── pages/          # PassengerDashboard, DriverDashboard, AdminDashboard, Login, Register
│   │   ├── types/          # TypeScript definitions
│   │   ├── App.tsx         # Main router layout
│   │   └── main.tsx        # React entry point
│   ├── package.json        # Frontend dependencies & scripts
│   ├── tailwind.config.js  # RYDO design system & custom animations
│   └── vite.config.ts      # Vite configuration & API proxy
│
├── render.yaml             # Render Cloud blueprint specification
├── README.md               # Project documentation
└── .gitignore              # Git exclusions
```

---

## 👥 Demo Accounts (1-Click Switcher Available)

The application automatically seeds the database with the following demo accounts:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Passenger** | `passenger.alice@rydo.com` | `Pass@123` | Active passenger with saved trip history |
| **Driver** | `driver.john@rydo.com` | `Driver@123` | Toyota Camry Hybrid (RYDO Go), 4.9 ★ rating |
| **Driver** | `driver.sarah@rydo.com` | `Driver@123` | Tesla Model 3 (RYDO Comfort), 5.0 ★ rating |
| **Driver** | `driver.mike@rydo.com` | `Driver@123` | Chevrolet Suburban (RYDO XL), 4.8 ★ rating |
| **Admin** | `admin@rydo.com` | `Admin@123` | Platform operations manager with full analytics access |

> 💡 **Tip**: On the Login screen or in the top navigation bar, use the **1-Click Demo Login** buttons to instantly switch between Passenger, Driver, and Admin views without typing passwords.

---

## 🛠️ Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend API (runs on http://localhost:8000)
uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 2. Frontend Setup
```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Automated Testing

Run the end-to-end backend verification script to test authentication, fare estimation, ride matching, driver acceptance, arrival, PIN start, completion, payment settlement, rating, and admin analytics:

```bash
cd backend
python test_backend.py
```

---

## ☁️ Deploying to Render

This repository includes a pre-configured `render.yaml` blueprint for one-click deployment:

1. Push this repository to GitHub or GitLab.
2. In the **Render Dashboard**, click **New +** → **Blueprint**.
3. Select your repository.
4. Render will automatically detect `render.yaml` and provision:
   - **`rydo-api`**: FastAPI Web Service (Python)
   - **`rydo-frontend`**: React Static Site (Vite)
   - **`rydo-db`**: Render Managed PostgreSQL Database
5. Once deployed, access the frontend through the temporary Render URL provided in your dashboard!
