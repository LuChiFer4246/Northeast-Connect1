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
- Converts chaotic, panicked user
