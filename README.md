# Night Out Baltic

Tartu nightlife MVP with a Go backend and a React/Next.js frontend.

The app uses a real OpenStreetMap/Leaflet map centered on Tartu, then overlays seeded venue data, live-style crowd simulation, heatmap intensity, event search, and anonymous user contributions.

## What It Does

- Real Tartu map with clickable nightlife markers
- Heatmap where busier venues become hotter
- Time frames: now, tonight, late, weekend
- Search by venue, area, music, tag, or event
- Venue detail panel with qualitative crowd level, estimated entry feel, events, tags, and area vibe
- Anonymous user actions:
  - `I am going` adds one planned person
  - `Check in` adds a stronger live signal
  - `Not going` intentionally does not affect crowd
  - vibe reports update the displayed venue vibe
- Go API with in-memory dummy data, no database needed

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

The venue list is intentionally seeded dummy data for MVP validation. The UI avoids exact headcounts and represents crowd as qualitative levels. For production, the next step would be replacing or enriching the seed data with OpenStreetMap/Overpass venue imports and owner-verified entries.
