# Northeast Connect — Disaster Management & Community Emergency Assistant

An open-source, offline-first disaster response and emergency coordination web application built specifically for **North East India** (Assam, Meghalaya, Arunachal Pradesh, Manipur, Mizoram, Nagaland, Tripura, and Sikkim).

Built in a 3-hour Prompt War Hackathon (PS 05) using structured AI-assisted development, **Northeast Connect** is designed for users of all ages—especially during floods, landslides, and earthquakes when panic is high and mobile networks fail.

---

## The Problem
Regions across North East India face recurring floods, landslides, and seismic events. During emergencies:
- Citizens struggle to find verified helpline numbers and nearby relief camps quickly.
- Cellular networks and mobile internet frequently drop, rendering standard web apps unusable.
- Official updates often lag behind real-time conditions on the ground.

## Key Features

### 1. Offline-First Architecture (PWA + `localStorage`)
- Caches verified helplines, relief camp directories, survival guides, and incident alerts locally via a Service Worker (`sw.js`) and `localStorage`.
- Live **Online / Offline Mode** status indicator in the header.
- **List View** fallback ensures all relief camps and alerts remain accessible even when map tiles cannot load over weak 2G or offline connections.

### 2. 1-Tap Verified NE Helpline Bar
Always-visible emergency bar with direct `tel:` links for instant mobile dialing:
- **1070** – State Emergency Operation Centre (SEOC)
- **1079** – ASDMA Disaster Management Helpline
- **1077** – District Emergency Operation Centre (DEOC)
- **108** – Medical Emergency / Ambulance
- **112** – National Integrated Emergency (Police, Fire, Rescue)

### 3. Interactive Disaster & Relief Map (Zero Paid APIs)
- Powered by **Leaflet.js** and free OpenStreetMap tiles (no Google Maps API key required).
- Color-coded markers and category filters for **Active Flood Zones**, **Landslide-Prone / Blocked Roads**, **Relief Camps**, and **Emergency Hospitals** across Guwahati, Silchar, Kaziranga, Haflong, Shillong, Jorhat, and Dibrugarh.

### 4. AI SOS Triage & Emergency Message Generator (`POST /api/triage`)
- Converts chaotic, panicked user messages into structured, actionable emergency data using the **Gemini API**.
- Outputs **Urgency Level**, **Category**, **Recommended Helpline**, **3 Calm Next Steps**, and a compact **WhatsApp / SMS-ready SOS message** with optional browser GPS coordinates.
- Includes a built-in **offline keyword fallback** so SOS triage continues working even if the internet or AI API is unavailable.

### 5. Live Community Incident Reporter (`GET/POST /api/incidents`)
- Allows locals to report waterlogging, landslides, blocked roads, or relief needs in real time.
- Updates the Express backend, drops a new pin on the live map, and appends to the community alert feed immediately.

### 6. All-Ages Accessibility & Pocket Survival Guide
- **Elderly / Low-Battery Mode:** Pure black (`#000000`) high-contrast theme with extra-large text to save OLED battery during power outages.
- **Multi-Language Toggle:** Switch between **English, Assamese, and Hindi** for helplines and survival guides.
- **Offline Survival Guide & Go-Bag Checklist:** Actionable Do's and Don'ts for floods, landslides, and earthquakes with checklist progress saved locally.

---

## Tech Stack (100% Open-Source & Free-Tier)

- **Frontend:** React, TypeScript, Tailwind CSS, Lucide Icons, Leaflet.js
- **Backend:** Node.js, Express (`server.ts`)
- **AI Engine:** Google Gemini API (`@google/genai`) with local keyword fallback
- **Offline Storage:** Service Worker (`sw.js`) & Browser `localStorage`
- **Deployment:** Google Cloud Run / Vercel

---

## Backend API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/incidents` | Returns pre-loaded and community-reported disaster incidents & relief camps |
| `POST` | `/api/incidents` | Submits a new community incident and updates the live feed/map |
| `POST` | `/api/triage` | Analyzes an emergency text message via Gemini API (with offline fallback) and returns structured SOS triage JSON |

---

## Running Locally

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <your-repo-folder>
- 
