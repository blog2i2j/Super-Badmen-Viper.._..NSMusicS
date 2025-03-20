package repository_app

import (
	"context"
	"fmt"
	"github.com/amitshekhariitbhu/go-backend-clean-architecture/domain"
	"github.com/amitshekhariitbhu/go-backend-clean-architecture/domain/domain_app"
	"github.com/amitshekhariitbhu/go-backend-clean-architecture/mongo"
	"go.mongodb.org/mongo-driver/bson"
)

type AppPlaylistIDConfigRepository interface {
	Create(ctx context.Context, configs []*domain_app.AppPlaylistIDConfig) error
	ReplaceAll(ctx context.Context, configs []*domain_app.AppPlaylistIDConfig) error
	GetAll(ctx context.Context) ([]*domain_app.AppPlaylistIDConfig, error)
}

type AppPlaylistIDConfigRepo struct {
	db         mongo.Database
	collection string
}

func NewAppPlaylistIDConfigRepository(db mongo.Database, collection string) AppPlaylistIDConfigRepository {
	return &AppPlaylistIDConfigRepo{db: db, collection: collection}
}

func (r *AppPlaylistIDConfigRepo) ReplaceAll(ctx context.Context, configs []*domain_app.AppPlaylistIDConfig) error {
	coll := r.db.Collection(r.collection)

	if _, err := coll.DeleteMany(ctx, bson.M{}); err != nil {
		return fmt.Errorf("replaceAll failed to delete: %w", err)
	}

	if len(configs) == 0 {
		return nil
	}

	if _, err := coll.InsertMany(ctx, convertToInterfaceSliceAppPlaylistIDConfig(configs)); err != nil {
		return fmt.Errorf("replaceAll failed to insert: %w", err)
	}
	return nil
}
func convertToInterfaceSliceAppPlaylistIDConfig(configs []*domain_app.AppPlaylistIDConfig) []interface{} {
	docs := make([]interface{}, len(configs))
	for i, c := range configs {
		docs[i] = c
	}
	return docs
}

func (r *AppPlaylistIDConfigRepo) Create(ctx context.Context, configs []*domain_app.AppPlaylistIDConfig) error {
	documents := make([]interface{}, len(configs))
	for i, c := range configs {
		documents[i] = c
	}
	_, err := r.db.Collection(r.collection).InsertMany(ctx, documents)
	return err
}

func (r *AppPlaylistIDConfigRepo) GetAll(ctx context.Context) ([]*domain_app.AppPlaylistIDConfig, error) {
	coll := r.db.Collection(r.collection)

	cursor, err := coll.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("find failed: %w", err)
	}
	defer cursor.Close(ctx)

	var configs []*domain_app.AppPlaylistIDConfig
	if err := cursor.All(ctx, &configs); err != nil {
		return nil, fmt.Errorf("decode failed: %w", err)
	}

	if len(configs) == 0 {
		return nil, domain.ErrEmptyCollection
	}
	return configs, nil
}
