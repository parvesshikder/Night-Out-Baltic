# Night Out Baltic

Tartu nightlife MVP with a Go backend and a React/Next.js frontend.

The app uses a real OpenStreetMap/Leaflet map centered on Tartu, then overlays seeded venue data, live-style crowd simulation, heatmap intensity, event search, and anonymous user contributions.

## Live App

- Frontend: https://nightoutbaltic.netlify.app/
- Backend: deployed separately on Render and configured through `NEXT_PUBLIC_API_URL`

## What It Does

- Real Tartu map with clickable nightlife markers
- Heatmap where busier venues become hotter
- Time frames: now, tonight, late, weekend
- Search by venue, area, music, tag, or event
- Venue detail panel with qualitative crowd level, estimated entry feel, events, tags, and area vibe
- Built-in Tartu demo fallback so the UI still has map markers, heat, events, and search if the live API is unavailable
- Anonymous user actions:
  - `Going` adds one planned person
  - `Check in` adds a stronger live signal
  - `Not going` intentionally does not affect crowd
  - vibe reports update the displayed venue vibe
- Go API with in-memory dummy data, no database needed

## Deployment

Recommended free deployment split:

- Frontend: Netlify
- Backend: Render

Netlify uses the root `netlify.toml` file:

```toml
[build]
base = "frontend"
command = "npm run build"
publish = ".next"
```

Set this environment variable in Netlify:

```txt
NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com
```

The Go backend reads Render's `PORT` environment variable and exposes health at:

```txt
GET /health
```

## Run With Docker

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:3000
- Backend: http://localhost:8081/health

## Run Locally

Backend:

```bash
cd backend
GOCACHE=/private/tmp/codex-go-cache PORT=8081 go run .
```

Frontend:

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8081 npm run dev
```

## API

- `GET /api/venues?timeframe=now&query=&vibe=all&area=all`
- `GET /api/venues/{id}?timeframe=tonight`
- `POST /api/venues/{id}/contribute?timeframe=now`
- `GET /api/events?timeframe=late&query=dj`
- `GET /api/heatmap?timeframe=weekend`

Example contribution body:

```json
{
  "action": "check_in",
  "vibe": "busy"
}
```

To validate the Minimum Viable Product (MVP), the venue list is populated with sample data. The user interface displays crowd levels qualitatively rather than with precise numbers. For a production-ready version, the plan is to substitute or augment this sample data with venue information imported from OpenStreetMap/Overpass and through entries verified by owners.

