package domain_file_entity_audio_models

import "time"

type PlaylistMetadata struct {
	ID          string    `bson:"_id"`
	Name        string    `bson:"name"`
	Comment     string    `bson:"comment"`
	Duration    float64   `bson:"duration"`
	SongCount   float64   `bson:"song_count"`
	Public      bool      `bson:"public"`
	CreatedAt   time.Time `bson:"created_at"`
	UpdatedAt   time.Time `bson:"updated_at"`
	Path        string    `bson:"path"`
	Sync        bool      `bson:"sync"`
	Size        int       `bson:"size"`
	Rules       string    `bson:"rules"`
	EvaluatedAt time.Time `bson:"evaluated_at"`
	OwnerID     string    `bson:"owner_id"`
}
