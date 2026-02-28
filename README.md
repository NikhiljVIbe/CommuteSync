# CommuteSync 🚗💨

CommuteSync is a smart traffic notification system that analyzes real-time traffic data to help you time your departure perfectly. It monitors your commute and sends you an email alert 15 minutes before either your usual start time or the optimal departure window—whichever comes first.

## Features ✨

- **Smart Analysis**: Scans traffic patterns -1 to +3 hours around your commute time.
- **Dynamic Alerts**: Sends emails via Nodemailer when it's time to leave.
- **Interactive UI**: 
  - Collapsible sidebar and map for focused planning.
  - Custom Time Picker with scroll and manual entry support.
  - Real-time Google Maps integration.
- **Reliable Backend**: Robust cron service running with 1-minute precision.

## Tech Stack 🛠️

- **Frontend**: Next.js, React, Google Maps API, Glassmorphism UI.
- **Backend**: Node.js, Express, node-cron, Nodemailer.
- **Database**: Local JSON storage for efficient, low-overhead scheduling.

## Getting Started 🚀

1. **Clone the repository**:
   ```bash
   git clone https://github.com/NikhiljVIbe/CommuteSync.git
   ```

2. **Setup Backend**:
   - `cd backend`
   - `npm install`
   - Create a `.env` file with your `GOOGLE_MAPS_API_KEY`, `EMAIL_USER`, and `EMAIL_PASS`.
   - `npm run dev`

3. **Setup Frontend**:
   - `cd frontend`
   - `npm install`
   - Create a `.env.local` file with `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and `NEXT_PUBLIC_API_URL`.
   - `npm run dev`

## License 📄
MIT
