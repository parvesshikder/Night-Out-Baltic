package main

func crowd(now int, tonight int, late int, weekend int) map[TimeFrame]int {
	return map[TimeFrame]int{
		TimeNow:     now,
		TimeTonight: tonight,
		TimeLate:    late,
		TimeWeekend: weekend,
	}
}

func seedVenues() []Venue {
	return []Venue{
		{
			ID: "moku", Name: "Moku", Kind: "bar", Area: "Old Town", Address: "Ruutli 18", Lat: 58.38101, Lng: 26.72184, Capacity: 85,
			Tags: []string{"student classic", "cheap beer", "casual"}, Music: []string{"indie", "mixed"}, Price: "€", OpenHours: "18:00-03:00",
			Description: "A relaxed student-heavy bar around Ruutli, good when the night needs easy conversation before it gets louder.",
			BaseCrowd:   crowd(28, 62, 76, 82),
		},
		{
			ID: "naiiv", Name: "Naiiv", Kind: "craft bar", Area: "Old Town", Address: "Vallikraavi 6", Lat: 58.37920, Lng: 26.72050, Capacity: 120,
			Tags: []string{"craft beer", "courtyard", "groups"}, Music: []string{"house", "funk", "open format"}, Price: "€€", OpenHours: "17:00-02:00",
			Description: "Craft beer energy with a roomy social feel, often good for groups that want atmosphere without a full club commitment.",
			BaseCrowd:   crowd(38, 80, 88, 96),
		},
		{
			ID: "kivi", Name: "Kivi Baar", Kind: "bar", Area: "Old Town", Address: "Ruutli 13", Lat: 58.38067, Lng: 26.72293, Capacity: 75,
			Tags: []string{"late-night", "compact", "local"}, Music: []string{"rock", "alt", "party"}, Price: "€", OpenHours: "19:00-04:00",
			Description: "Small, central, and very dependent on timing: perfect when alive, awkward when empty, exactly the kind of place live data helps.",
			BaseCrowd:   crowd(18, 55, 70, 74),
		},
		{
			ID: "gen-klubi", Name: "Genialistide Klubi", Kind: "culture club", Area: "Aparaaditehas", Address: "Magasini 5", Lat: 58.37476, Lng: 26.71642, Capacity: 260,
			Tags: []string{"concerts", "culture", "dance floor"}, Music: []string{"live", "electronic", "indie"}, Price: "€€", OpenHours: "18:00-late",
			Description: "A cultural nightlife anchor: concerts, parties, and creative crowd energy near Aparaaditehas.",
			BaseCrowd:   crowd(42, 145, 190, 218),
		},
		{
			ID: "aparaat", Name: "Aparaaditehas Yard", Kind: "social area", Area: "Aparaaditehas", Address: "Kastani 42", Lat: 58.37339, Lng: 26.71654, Capacity: 320,
			Tags: []string{"food", "terrace", "meetups"}, Music: []string{"ambient", "pop-up"}, Price: "€€", OpenHours: "12:00-00:00",
			Description: "A cluster-like social zone for food, drinks, and pop-up events. The area pulse matters more than one exact door.",
			BaseCrowd:   crowd(96, 170, 88, 230),
		},
		{
			ID: "pussirohukelder", Name: "Pussirohukelder", Kind: "pub", Area: "Toome Hill", Address: "Lossi 28", Lat: 58.37979, Lng: 26.71805, Capacity: 300,
			Tags: []string{"historic", "big tables", "pub food"}, Music: []string{"pub", "live nights"}, Price: "€€", OpenHours: "12:00-01:00",
			Description: "Historic cellar pub with room for large groups and a different vibe from the Ruutli bar strip.",
			BaseCrowd:   crowd(80, 160, 120, 210),
		},
		{
			ID: "shakespeare", Name: "Shakespeare", Kind: "pub", Area: "Old Town", Address: "Vanemuise 6", Lat: 58.37702, Lng: 26.72493, Capacity: 140,
			Tags: []string{"pub", "food", "quiz nights"}, Music: []string{"pub", "throwbacks"}, Price: "€€", OpenHours: "12:00-02:00",
			Description: "Reliable pub option near the city center, useful as a safe fallback when louder places look too packed.",
			BaseCrowd:   crowd(48, 82, 78, 110),
		},
		{
			ID: "rp9", Name: "RP9", Kind: "cocktail bar", Area: "Old Town", Address: "Raekoja plats 9", Lat: 58.38017, Lng: 26.72237, Capacity: 95,
			Tags: []string{"cocktails", "date night", "central"}, Music: []string{"lounge", "deep house"}, Price: "€€€", OpenHours: "17:00-02:00",
			Description: "Central cocktail stop with a polished vibe, better for smaller groups and late-evening plans.",
			BaseCrowd:   crowd(24, 68, 78, 88),
		},
		{
			ID: "vein-ja-vine", Name: "Vein ja Vine", Kind: "wine bar", Area: "Old Town", Address: "Ruutli 8", Lat: 58.38036, Lng: 26.72266, Capacity: 60,
			Tags: []string{"wine", "quiet", "conversation"}, Music: []string{"jazz", "soft"}, Price: "€€€", OpenHours: "16:00-00:00",
			Description: "Wine-first, calmer, and best when the goal is conversation rather than maximum noise.",
			BaseCrowd:   crowd(18, 42, 26, 50),
		},
		{
			ID: "pahad-poisid", Name: "Pahad Poisid", Kind: "pub", Area: "Old Town", Address: "Küütri 2", Lat: 58.38106, Lng: 26.72298, Capacity: 160,
			Tags: []string{"sports", "pub", "food"}, Music: []string{"pub", "sports"}, Price: "€€", OpenHours: "11:00-02:00",
			Description: "Casual pub energy near the square, often used as a starting point before choosing the final night direction.",
			BaseCrowd:   crowd(62, 110, 90, 132),
		},
		{
			ID: "illegaard", Name: "Illegaard", Kind: "pub", Area: "Old Town", Address: "Ulikooli 5", Lat: 58.38012, Lng: 26.72318, Capacity: 110,
			Tags: []string{"student", "basement", "pub"}, Music: []string{"rock", "retro"}, Price: "€", OpenHours: "17:00-03:00",
			Description: "Basement pub feel, popular for students who want something easy, central, and not too formal.",
			BaseCrowd:   crowd(32, 76, 86, 96),
		},
		{
			ID: "trepp", Name: "Trepp", Kind: "bar", Area: "Old Town", Address: "Ruutli 16", Lat: 58.38081, Lng: 26.72206, Capacity: 70,
			Tags: []string{"shots", "small groups", "late"}, Music: []string{"party", "pop"}, Price: "€", OpenHours: "20:00-04:00",
			Description: "A compact stop that can flip from empty to packed quickly, making live crowd checks especially useful.",
			BaseCrowd:   crowd(12, 48, 68, 72),
		},
		{
			ID: "shooters", Name: "Shooters Tartu", Kind: "shot bar", Area: "Old Town", Address: "Ruutli area", Lat: 58.38092, Lng: 26.72136, Capacity: 90,
			Tags: []string{"shots", "party starter", "quick stop"}, Music: []string{"pop", "club"}, Price: "€", OpenHours: "20:00-04:00",
			Description: "Fast, loud, and very timing-sensitive. Usually a short stop before people move to a club or bigger bar.",
			BaseCrowd:   crowd(10, 62, 88, 94),
		},
		{
			ID: "club-illusion", Name: "Club Illusion", Kind: "nightclub", Area: "City Centre", Address: "Raatuse 97", Lat: 58.38342, Lng: 26.73351, Capacity: 500,
			Tags: []string{"club", "dance", "large crowd"}, Music: []string{"edm", "pop", "hip-hop"}, Price: "€€", OpenHours: "23:00-05:00",
			Description: "Large club option where the only question that matters is whether the night has started yet.",
			BaseCrowd:   crowd(0, 140, 360, 430),
		},
		{
			ID: "club-maasikas", Name: "Club Maasikas", Kind: "nightclub", Area: "Old Town", Address: "Küüni area", Lat: 58.37861, Lng: 26.72476, Capacity: 360,
			Tags: []string{"club", "dance", "mainstream"}, Music: []string{"pop", "dance", "throwbacks"}, Price: "€€", OpenHours: "23:00-05:00",
			Description: "Mainstream club-night energy, strongest later than most bars.",
			BaseCrowd:   crowd(0, 90, 255, 310),
		},
		{
			ID: "underground", Name: "Underground", Kind: "music bar", Area: "Old Town", Address: "Küütri area", Lat: 58.38144, Lng: 26.72347, Capacity: 95,
			Tags: []string{"alternative", "basement", "late-night"}, Music: []string{"metal", "rock", "alt"}, Price: "€", OpenHours: "19:00-03:00",
			Description: "Alternative basement mood with a loyal crowd; not for every group, perfect for the right one.",
			BaseCrowd:   crowd(14, 50, 74, 84),
		},
		{
			ID: "sheriff", Name: "Sheriff Saloon", Kind: "pub", Area: "City Centre", Address: "Turu area", Lat: 58.37622, Lng: 26.73264, Capacity: 120,
			Tags: []string{"pub", "casual", "food"}, Music: []string{"country", "pub", "classic rock"}, Price: "€€", OpenHours: "12:00-01:00",
			Description: "Casual pub away from the most crowded old-town line, good for a more predictable night.",
			BaseCrowd:   crowd(34, 72, 54, 86),
		},
		{
			ID: "big-ben", Name: "Big Ben Pub", Kind: "pub", Area: "City Centre", Address: "Turu 27", Lat: 58.37423, Lng: 26.73385, Capacity: 130,
			Tags: []string{"pub", "food", "sports"}, Music: []string{"pub", "sports"}, Price: "€€", OpenHours: "12:00-01:00",
			Description: "A straightforward pub pick when the group wants seats, drinks, and less old-town chaos.",
			BaseCrowd:   crowd(36, 76, 48, 92),
		},
		{
			ID: "barlova", Name: "Barlova", Kind: "neighbourhood bar", Area: "Karlova", Address: "Tähe area", Lat: 58.36923, Lng: 26.72412, Capacity: 85,
			Tags: []string{"karlova", "local", "cozy"}, Music: []string{"vinyl", "indie", "soul"}, Price: "€€", OpenHours: "17:00-01:00",
			Description: "Cozy neighbourhood energy in Karlova, good for people who want to avoid the center.",
			BaseCrowd:   crowd(26, 58, 52, 72),
		},
		{
			ID: "vildes", Name: "Vilde ja Vine", Kind: "restaurant bar", Area: "Old Town", Address: "Vallikraavi 4", Lat: 58.37955, Lng: 26.72097, Capacity: 150,
			Tags: []string{"wine", "food", "terrace"}, Music: []string{"lounge", "soft pop"}, Price: "€€€", OpenHours: "12:00-00:00",
			Description: "Food-and-wine style venue that works well for early evening groups and calmer plans.",
			BaseCrowd:   crowd(56, 98, 42, 112),
		},
		{
			ID: "hansa-hoov", Name: "Hansa Hoov", Kind: "beer garden", Area: "City Centre", Address: "Aleksandri 46", Lat: 58.37195, Lng: 26.73547, Capacity: 240,
			Tags: []string{"beer garden", "summer", "big groups"}, Music: []string{"live", "folk", "pub"}, Price: "€€", OpenHours: "12:00-00:00",
			Description: "Bigger beer-garden feel, especially useful in warm weather and group-heavy weekends.",
			BaseCrowd:   crowd(46, 122, 74, 180),
		},
		{
			ID: "de-tolly", Name: "De Tolly Beer Garden", Kind: "beer garden", Area: "Toome Hill", Address: "Näituse area", Lat: 58.37866, Lng: 26.71366, Capacity: 180,
			Tags: []string{"beer", "outdoor", "summer"}, Music: []string{"pub", "acoustic"}, Price: "€€", OpenHours: "15:00-00:00",
			Description: "Outdoor-friendly beer stop near Toome, strongest when the weather helps.",
			BaseCrowd:   crowd(30, 84, 42, 128),
		},
		{
			ID: "krempel", Name: "Krempel", Kind: "cafe bar", Area: "Old Town", Address: "Ruutli 12", Lat: 58.38059, Lng: 26.72240, Capacity: 70,
			Tags: []string{"cafe", "cocktails", "low-key"}, Music: []string{"soul", "chill"}, Price: "€€", OpenHours: "10:00-23:00",
			Description: "Low-key cafe-bar mood for a softer start to the evening.",
			BaseCrowd:   crowd(24, 42, 14, 48),
		},
		{
			ID: "humal", Name: "Humal", Kind: "craft beer bar", Area: "Old Town", Address: "Old Town", Lat: 58.37986, Lng: 26.72411, Capacity: 80,
			Tags: []string{"craft beer", "tasting", "small groups"}, Music: []string{"indie", "chill"}, Price: "€€", OpenHours: "16:00-01:00",
			Description: "Craft-beer focused stop where crowd quality matters more than raw volume.",
			BaseCrowd:   crowd(20, 54, 50, 68),
		},
		{
			ID: "raekoja-pop", Name: "Raekoja Pop-up Terrace", Kind: "seasonal bar", Area: "Town Hall Square", Address: "Raekoja plats", Lat: 58.38004, Lng: 26.72215, Capacity: 160,
			Tags: []string{"seasonal", "terrace", "tourists"}, Music: []string{"pop", "lounge"}, Price: "€€", OpenHours: "12:00-00:00",
			Description: "Seasonal central terrace-style listing included to make the heatmap feel alive around the square.",
			BaseCrowd:   crowd(50, 94, 36, 132),
		},
	}
}

func seedEvents() []Event {
	return []Event{
		{ID: "evt-gen-live", VenueID: "gen-klubi", VenueName: "Genialistide Klubi", Title: "Indie Night: Local Bands", StartsAt: "20:30", TimeFrame: TimeTonight, Price: "€8", Tags: []string{"live", "indie"}, Description: "Local live sets followed by a DJ warmdown."},
		{ID: "evt-illusion-student", VenueID: "club-illusion", VenueName: "Club Illusion", Title: "Student Friday Pulse", StartsAt: "23:30", TimeFrame: TimeLate, Price: "€10", Tags: []string{"club", "student"}, Description: "Main-room club night for students and Erasmus groups."},
		{ID: "evt-maasikas-pop", VenueID: "club-maasikas", VenueName: "Club Maasikas", Title: "Pop Floor All Night", StartsAt: "23:00", TimeFrame: TimeLate, Price: "€8", Tags: []string{"club", "dance"}, Description: "Mainstream pop, dance, and throwback floor."},
		{ID: "evt-naiiv-yard", VenueID: "naiiv", VenueName: "Naiiv", Title: "Courtyard DJ Session", StartsAt: "21:00", TimeFrame: TimeTonight, Price: "Free", Tags: []string{"dj", "courtyard"}, Description: "Outdoor-friendly DJ session when the courtyard fills up."},
		{ID: "evt-moku-quiz", VenueID: "moku", VenueName: "Moku", Title: "Chaotic Table Quiz", StartsAt: "20:00", TimeFrame: TimeTonight, Price: "Free", Tags: []string{"quiz", "student"}, Description: "Low-stakes quiz night that usually becomes a social mixer."},
		{ID: "evt-puss-live", VenueID: "pussirohukelder", VenueName: "Pussirohukelder", Title: "Cellar Live Covers", StartsAt: "21:30", TimeFrame: TimeWeekend, Price: "€6", Tags: []string{"live", "pub"}, Description: "Big-room pub covers and large-table weekend groups."},
		{ID: "evt-barlova-vinyl", VenueID: "barlova", VenueName: "Barlova", Title: "Karlova Vinyl Evening", StartsAt: "19:30", TimeFrame: TimeTonight, Price: "Free", Tags: []string{"vinyl", "chill"}, Description: "Cozy records and neighbourhood bar mood."},
		{ID: "evt-underground-alt", VenueID: "underground", VenueName: "Underground", Title: "Alt Basement Hour", StartsAt: "22:00", TimeFrame: TimeLate, Price: "€5", Tags: []string{"alt", "rock"}, Description: "Alternative basement set for heavier late-night plans."},
		{ID: "evt-aparaat-market", VenueID: "aparaat", VenueName: "Aparaaditehas Yard", Title: "Factory Yard Social", StartsAt: "18:00", TimeFrame: TimeWeekend, Price: "Free", Tags: []string{"yard", "food"}, Description: "Food, drinks, and pop-up stands around the factory courtyard."},
		{ID: "evt-rp9-cocktail", VenueID: "rp9", VenueName: "RP9", Title: "Cocktail Hour", StartsAt: "19:00", TimeFrame: TimeTonight, Price: "€€", Tags: []string{"cocktails", "date"}, Description: "Early evening cocktail flow before the louder venues take over."},
	}
}
