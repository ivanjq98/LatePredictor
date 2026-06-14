# LatePredictor

**How late will she be?** — A machine-learning-powered lateness predictor built by **JobSeekers Pte Ltd**.

LatePredictor lets you select a destination on a live map, pick an occasion category and a date/time, and get an AI-estimated number of minutes of lateness — then broadcasts the prediction straight to a Telegram group with a countdown to expected arrival.

---

## Features

- **ML-powered prediction** — sends start/destination coordinates, category, and datetime to a hosted ML model and returns an estimated lateness in minutes
- **Interactive map search** — type any location and pick from geocoded results (OpenStreetMap / Nominatim); the start point is fixed to the subject's home address
- **Category selection** — choose from occasions stored in Supabase (dinner/drinks, exercise, work/career fair, breakfast, lunch, apply job, etc.)
- **Telegram notifications** — predictions are pushed to a Telegram group via a bot, including date, occasion, destination, and expected arrival time
- **Arrival submission** — after the event, submit the actual arrival time; a confirmation message is sent to the same Telegram group for model feedback tracking
- **Tableau analytics** — an embedded Tableau dashboard on the About page shows historical lateness stats
- **Dark / Light theme** — site-wide theme toggle persisted via React context
- **About & Contributors pages** — profile page for the subject and a team page listing all contributors

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Notifications | Telegram Bot API |
| Maps | Nominatim (OpenStreetMap geocoding), Leaflet |
| Logging | Pino |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main predictor UI
│   ├── about/page.tsx        # Subject profile + Tableau dashboard
│   ├── contributor/page.tsx  # Team contributors page
│   ├── api/
│   │   └── telegram/
│   │       ├── predict/      # POST — send prediction to Telegram
│   │       └── arrival/      # POST — send actual arrival to Telegram
│   └── layout.tsx            # Root layout with Navbar, Footer, ThemeProvider
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── PredictionHeader.tsx
│   ├── ArrivalSubmit.tsx
│   ├── CallToAction.tsx
│   ├── TableauDashboard.tsx
│   └── PerforatedTear.tsx
├── context/
│   └── ThemeContext.tsx       # Dark/light theme state
└── lib/
    ├── supabaseClient.ts
    ├── resendClient.ts
    └── logger.ts
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project with a `Category` table
- A Telegram bot token and chat ID
- A hosted ML prediction API

### Environment Variables

Create a `.env.local` file in the project root:

```env
# ML prediction API
NEXT_PUBLIC_API_URL=<your-prediction-api-url>
NEXT_PUBLIC_API_FEEDBACK=<your-feedback-api-url>

# Fixed start coordinates (subject's home)
NEXT_PUBLIC_LAT=<latitude>
NEXT_PUBLIC_LNG=<longitude>

# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Telegram
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_CHAT_ID=<your-chat-id>

```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Deployment

The project is deployed on **Vercel**. Push to `main` to trigger a production deployment.

---

## Contributors

| Name |
|---|
| Ivan Tan Kah Keng 
| Tey Ming Chuan 
| Eunice Han Wen Xin 
