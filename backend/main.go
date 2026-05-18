package main

import (
	"encoding/json"
	"log"
	"math"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

type TimeFrame string

const (
	TimeNow     TimeFrame = "now"
	TimeTonight TimeFrame = "tonight"
	TimeLate    TimeFrame = "late"
	TimeWeekend TimeFrame = "weekend"
)

type Venue struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Kind        string            `json:"kind"`
	Area        string            `json:"area"`
	Address     string            `json:"address"`
	Lat         float64           `json:"lat"`
	Lng         float64           `json:"lng"`
	Capacity    int               `json:"capacity"`
	Tags        []string          `json:"tags"`
	Music       []string          `json:"music"`
	Price       string            `json:"price"`
	OpenHours   string            `json:"openHours"`
	Description string            `json:"description"`
	BaseCrowd   map[TimeFrame]int `json:"-"`
}

type Event struct {
	ID          string    `json:"id"`
	VenueID     string    `json:"venueId"`
	VenueName   string    `json:"venueName"`
	Title       string    `json:"title"`
	StartsAt    string    `json:"startsAt"`
	TimeFrame   TimeFrame `json:"timeframe"`
	Price       string    `json:"price"`
	Tags        []string  `json:"tags"`
	Description string    `json:"description"`
}

type VenueState struct {
	Venue
	Crowd        int       `json:"crowd"`
	CrowdPercent int       `json:"crowdPercent"`
	Heat         float64   `json:"heat"`
	Vibe         string    `json:"vibe"`
	VibeLabel    string    `json:"vibeLabel"`
	WaitMinutes  int       `json:"waitMinutes"`
	Trending     string    `json:"trending"`
	LastUpdated  time.Time `json:"lastUpdated"`
	Events       []Event   `json:"events"`
}

type HeatPoint struct {
	VenueID      string  `json:"venueId"`
	Name         string  `json:"name"`
	Lat          float64 `json:"lat"`
	Lng          float64 `json:"lng"`
	Intensity    float64 `json:"intensity"`
	Crowd        int     `json:"crowd"`
	CrowdPercent int     `json:"crowdPercent"`
}

type ContributionRequest struct {
	Action string `json:"action"`
	Vibe   string `json:"vibe"`
}

type ContributionResponse struct {
	Message string     `json:"message"`
	Venue   VenueState `json:"venue"`
}

type APIError struct {
	Error string `json:"error"`
}

type ContributionLedger struct {
	Going     int
	CheckIns  int
	VibeVotes map[string]int
}

type Server struct {
	mu            sync.RWMutex
	venues        []Venue
	events        []Event
	contributions map[string]*ContributionLedger
}

func main() {
	port := env("PORT", "8080")
	server := &Server{
		venues:        seedVenues(),
		events:        seedEvents(),
		contributions: map[string]*ContributionLedger{},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", server.health)
	mux.HandleFunc("GET /api/venues", server.listVenues)
	mux.HandleFunc("GET /api/venues/{id}", server.getVenue)
	mux.HandleFunc("POST /api/venues/{id}/contribute", server.contribute)
	mux.HandleFunc("GET /api/events", server.listEvents)
	mux.HandleFunc("GET /api/heatmap", server.heatmap)

	log.Printf("Night Out Baltic API listening on :%s", port)
	if err := http.ListenAndServe(":"+port, cors(mux)); err != nil {
		log.Fatal(err)
	}
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) listVenues(w http.ResponseWriter, r *http.Request) {
	frame := parseTimeFrame(r.URL.Query().Get("timeframe"))
	query := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("query")))
	vibeFilter := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("vibe")))
	areaFilter := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("area")))

	s.mu.RLock()
	states := make([]VenueState, 0, len(s.venues))
	for _, venue := range s.venues {
		state := s.stateForVenueLocked(venue, frame)
		if query != "" && !matchesVenue(state, query) {
			continue
		}
		if vibeFilter != "" && vibeFilter != "all" && state.Vibe != vibeFilter {
			continue
		}
		if areaFilter != "" && areaFilter != "all" && strings.ToLower(state.Area) != areaFilter {
			continue
		}
		states = append(states, state)
	}
	s.mu.RUnlock()

	sort.Slice(states, func(i, j int) bool {
		if states[i].CrowdPercent == states[j].CrowdPercent {
			return states[i].Name < states[j].Name
		}
		return states[i].CrowdPercent > states[j].CrowdPercent
	})
	writeJSON(w, http.StatusOK, states)
}

func (s *Server) getVenue(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	frame := parseTimeFrame(r.URL.Query().Get("timeframe"))

	s.mu.RLock()
	venue, ok := s.findVenueLocked(id)
	if !ok {
		s.mu.RUnlock()
		writeJSON(w, http.StatusNotFound, APIError{Error: "venue not found"})
		return
	}
	state := s.stateForVenueLocked(venue, frame)
	s.mu.RUnlock()

	writeJSON(w, http.StatusOK, state)
}

func (s *Server) contribute(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	frame := parseTimeFrame(r.URL.Query().Get("timeframe"))

	var req ContributionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, APIError{Error: "invalid JSON body"})
		return
	}

	action := strings.ToLower(strings.TrimSpace(req.Action))
	vibe := strings.ToLower(strings.TrimSpace(req.Vibe))

	s.mu.Lock()
	venue, ok := s.findVenueLocked(id)
	if !ok {
		s.mu.Unlock()
		writeJSON(w, http.StatusNotFound, APIError{Error: "venue not found"})
		return
	}

	ledger := s.ledgerForLocked(id)
	message := "No crowd change made."

	switch action {
	case "going":
		ledger.Going++
		message = "You are counted as going."
	case "check_in", "check-in", "checkin":
		ledger.CheckIns++
		message = "Check-in counted. Thanks for improving the live vibe."
	case "not_going", "not-going", "ignore":
		message = "Not going is ignored, so the live crowd stays unchanged."
	case "report", "vibe":
		message = "Vibe report saved."
	default:
		writeJSON(w, http.StatusBadRequest, APIError{Error: "action must be going, check_in, not_going, or report"})
		s.mu.Unlock()
		return
	}

	if vibe != "" && isAllowedVibe(vibe) {
		ledger.VibeVotes[vibe]++
	}

	state := s.stateForVenueLocked(venue, frame)
	s.mu.Unlock()

	writeJSON(w, http.StatusOK, ContributionResponse{Message: message, Venue: state})
}

func (s *Server) listEvents(w http.ResponseWriter, r *http.Request) {
	frame := parseTimeFrame(r.URL.Query().Get("timeframe"))
	query := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("query")))

	s.mu.RLock()
	events := make([]Event, 0, len(s.events))
	for _, event := range s.events {
		if frame != TimeNow && event.TimeFrame != frame {
			continue
		}
		if query != "" && !matchesEvent(event, query) {
			continue
		}
		events = append(events, event)
	}
	if frame == TimeNow && query == "" {
		events = append(events[:0], s.events...)
	}
	s.mu.RUnlock()

	sort.Slice(events, func(i, j int) bool {
		return events[i].StartsAt < events[j].StartsAt
	})
	writeJSON(w, http.StatusOK, events)
}

func (s *Server) heatmap(w http.ResponseWriter, r *http.Request) {
	frame := parseTimeFrame(r.URL.Query().Get("timeframe"))

	s.mu.RLock()
	points := make([]HeatPoint, 0, len(s.venues))
	for _, venue := range s.venues {
		state := s.stateForVenueLocked(venue, frame)
		if state.Crowd <= 0 {
			continue
		}
		points = append(points, HeatPoint{
			VenueID:      venue.ID,
			Name:         venue.Name,
			Lat:          venue.Lat,
			Lng:          venue.Lng,
			Intensity:    state.Heat,
			Crowd:        state.Crowd,
			CrowdPercent: state.CrowdPercent,
		})
	}
	s.mu.RUnlock()

	writeJSON(w, http.StatusOK, points)
}

func (s *Server) stateForVenueLocked(venue Venue, frame TimeFrame) VenueState {
	base := venue.BaseCrowd[frame]
	if base == 0 {
		base = venue.BaseCrowd[TimeNow]
	}

	ledger := s.contributions[venue.ID]
	checkIns := 0
	going := 0
	voteVibe := ""
	if ledger != nil {
		checkIns = ledger.CheckIns
		going = ledger.Going
		voteVibe = topVibeVote(ledger.VibeVotes)
	}

	dynamic := dynamicPulse(venue.ID, frame)
	crowd := base + dynamic + going + checkIns*2
	crowd = clamp(crowd, 0, venue.Capacity+15)

	percent := 0
	if venue.Capacity > 0 {
		percent = int(math.Round(float64(crowd) / float64(venue.Capacity) * 100))
	}
	percent = clamp(percent, 0, 140)

	vibe, label := vibeFromCrowd(percent)
	if voteVibe != "" {
		vibe = voteVibe
		label = labelForVibe(voteVibe)
	}

	events := s.eventsForVenueLocked(venue.ID, frame)

	return VenueState{
		Venue:        venue,
		Crowd:        crowd,
		CrowdPercent: percent,
		Heat:         heatFromPercent(percent),
		Vibe:         vibe,
		VibeLabel:    label,
		WaitMinutes:  waitFromPercent(percent),
		Trending:     trendFromPulse(dynamic, going, checkIns),
		LastUpdated:  time.Now().UTC(),
		Events:       events,
	}
}

func (s *Server) eventsForVenueLocked(venueID string, frame TimeFrame) []Event {
	events := make([]Event, 0, 3)
	for _, event := range s.events {
		if event.VenueID != venueID {
			continue
		}
		if frame != TimeNow && event.TimeFrame != frame {
			continue
		}
		events = append(events, event)
	}
	return events
}

func (s *Server) findVenueLocked(id string) (Venue, bool) {
	for _, venue := range s.venues {
		if venue.ID == id {
			return venue, true
		}
	}
	return Venue{}, false
}

func (s *Server) ledgerForLocked(id string) *ContributionLedger {
	ledger := s.contributions[id]
	if ledger == nil {
		ledger = &ContributionLedger{VibeVotes: map[string]int{}}
		s.contributions[id] = ledger
	}
	return ledger
}

func parseTimeFrame(value string) TimeFrame {
	switch TimeFrame(strings.ToLower(strings.TrimSpace(value))) {
	case TimeTonight:
		return TimeTonight
	case TimeLate:
		return TimeLate
	case TimeWeekend:
		return TimeWeekend
	default:
		return TimeNow
	}
}

func matchesVenue(venue VenueState, query string) bool {
	haystack := strings.ToLower(venue.Name + " " + venue.Kind + " " + venue.Area + " " + venue.Address + " " + venue.Price + " " + venue.Description + " " + strings.Join(venue.Tags, " ") + " " + strings.Join(venue.Music, " "))
	for _, event := range venue.Events {
		haystack += " " + strings.ToLower(event.Title+" "+event.Description+" "+event.Price+" "+strings.Join(event.Tags, " "))
	}
	return strings.Contains(haystack, query)
}

func matchesEvent(event Event, query string) bool {
	haystack := strings.ToLower(event.Title + " " + event.VenueName + " " + event.Description + " " + strings.Join(event.Tags, " "))
	return strings.Contains(haystack, query)
}

func dynamicPulse(id string, frame TimeFrame) int {
	now := time.Now()
	seed := 0
	for _, r := range id + string(frame) {
		seed += int(r)
	}
	phase := float64((now.Minute()+seed)%60) / 60 * math.Pi * 2
	wave := math.Sin(phase)*4 + math.Cos(phase*0.7)*3
	return int(math.Round(wave))
}

func vibeFromCrowd(percent int) (string, string) {
	switch {
	case percent <= 12:
		return "dead", "Quiet / dead"
	case percent <= 38:
		return "chill", "Chill"
	case percent <= 72:
		return "perfect", "Good energy"
	case percent <= 100:
		return "busy", "Busy"
	default:
		return "packed", "Packed"
	}
}

func labelForVibe(vibe string) string {
	switch vibe {
	case "dead":
		return "Quiet / dead"
	case "chill":
		return "Chill"
	case "perfect":
		return "Good energy"
	case "busy":
		return "Busy"
	case "packed":
		return "Packed"
	default:
		return "Live"
	}
}

func isAllowedVibe(vibe string) bool {
	switch vibe {
	case "dead", "chill", "perfect", "busy", "packed":
		return true
	default:
		return false
	}
}

func topVibeVote(votes map[string]int) string {
	best := ""
	bestCount := 0
	for vibe, count := range votes {
		if count > bestCount {
			best = vibe
			bestCount = count
		}
	}
	return best
}

func heatFromPercent(percent int) float64 {
	if percent <= 0 {
		return 0
	}
	heat := float64(percent) / 100
	if heat < 0.08 {
		return 0.08
	}
	if heat > 1 {
		return 1
	}
	return heat
}

func waitFromPercent(percent int) int {
	switch {
	case percent < 65:
		return 0
	case percent < 85:
		return 4
	case percent < 105:
		return 10
	default:
		return 18
	}
}

func trendFromPulse(dynamic int, going int, checkIns int) string {
	switch {
	case checkIns > 2:
		return "live check-ins rising"
	case going > 3:
		return "people planning to go"
	case dynamic > 3:
		return "heating up"
	case dynamic < -3:
		return "cooling down"
	default:
		return "steady"
	}
}

func clamp(value int, minValue int, maxValue int) int {
	if value < minValue {
		return minValue
	}
	if value > maxValue {
		return maxValue
	}
	return value
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("write response: %v", err)
	}
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
		} else {
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func env(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func atoi(value string, fallback int) int {
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}
