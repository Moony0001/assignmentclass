📡 Retail Proximity Marketing Platform ("The Phygital Engine")

A complete end-to-end IoT platform that bridges the gap between physical retail environments and digital customer engagement. This system allows retailers to manage Bluetooth Beacons, create hyper-local marketing campaigns, and track real-time customer analytics using a "Double Loop" architecture.

🏗️ Architecture: The "Double Loop"

This project implements a unique Double Loop Architecture to ensure reliability and data richness:

Loop 1 (The Action Loop): The Mobile App detects a beacon and triggers a notification locally based on cached rules. This ensures instant engagement (sub-100ms) without waiting for network latency.

Loop 2 (The Feedback Loop): The App asynchronously sends analytics (dwell time, engagement) and hardware telemetry (battery levels) back to the cloud for the Dashboard.

graph TD
    subgraph "Physical Store"
        Beacon((📡 Bluetooth Beacon)) -- Broadcasts UUID --> Phone[📱 Mobile App Receiver]
        Phone -- "1. Local Trigger (Instant)" --> User((👤 Customer))
    end

    subgraph "Cloud / Server"
        Phone -- "2. Async Telemetry & Analytics" --> API[⚙️ Node.js API]
        API --> DB[(🗄️ Supabase PostgreSQL)]
        DB --> Dash[💻 Web Dashboard]
        Manager((👨‍💼 Manager)) -- "Creates Campaigns" --> Dash
    end


✨ Key Features

🖥️ Web Dashboard (Control Tower)

Fleet Management: Register physical beacons, map them to stores, and monitor their battery health remotely (via crowd-sourced telemetry).

Campaign CMS: Create marketing rules (e.g., "If user is near the Denim Aisle, send '50% Off' coupon").

Real-Time Analytics: Visualize store traffic, campaign impressions, and conversion rates.

📱 Mobile Application (The Receiver)

Background Scanning: efficiently scans for iBeacon/Eddystone signals even when the phone is locked.

Smart Debouncing: Prevents notification spam using local storage timestamps.

Crowd-Sourced Maintenance: Every user acts as a health-check agent for the beacon hardware.

⚙️ Backend API

Security: Two-tier authentication (JWT for Web Dashboard, Static API Keys for Mobile App).

RESTful Architecture: Clean endpoints for managing organizations, beacons, and triggers.

🛠️ Tech Stack

Frontend: React (Vite), Tailwind CSS, Shadcn/ui, Recharts.

Backend: Node.js, Express, pg (node-postgres), JSON Web Tokens.

Database: PostgreSQL (Hosted on Supabase).

Mobile: React Native, react-native-beacons-manager, @notifee/react-native.

Hardware Protocol: iBeacon (UUID/Major/Minor).

🚀 Getting Started

Prerequisites

Node.js (v18 or higher)

PostgreSQL Database (or Supabase project)

Android Studio (for Mobile App simulation)

1. Database Setup (Supabase)

Run the SQL scripts provided in /database/schema.sql to create the following tables:

organizations, users, stores

beacons, campaigns, triggers

analytics_events

2. Backend API (api-server)

cd api-server
npm install
# Create a .env file with:
# PORT=3001
# DB_HOST=...
# DB_USER=...
# DB_PASSWORD=...
# JWT_SECRET=...
node index.js


Server runs on http://localhost:3001

3. Web Dashboard (web-app)

cd web-app
npm install
npm run dev


Dashboard runs on http://localhost:8080

4. Mobile App (mobileApp)

Note: Requires an Android device or Emulator.

Update src/api.js with your computer's local IP address (e.g., http://192.168.1.X:3001).

Connect device via USB.

Run the build:

cd mobileApp
npm install
npx react-native run-android


🧪 Testing Workflow

To demo the "Phygital" experience:

Setup: Open the Web Dashboard and create a Campaign linked to a virtual Beacon (UUID: fda50693..., Major: 10, Minor: 1).

Transmitter: Use a second phone (or "Beacon Simulator" app) to broadcast that specific UUID.

Receiver: Launch the Mobile App on an Android device. Ensure it says "Loaded 1 active campaigns".

Action: Walk the Transmitter phone towards the Receiver phone.

Result: * Receiver phone gets a Notification: "Winter Sale!"

Web Dashboard updates "Campaign Views" count in real-time.

📜 License

This project is open-source and available under the MIT License.