package repository_app

import (
	"context"
	"fmt"
	"github.com/amitshekhariitbhu/go-backend-clean-architecture/domain"
	"github.com/amitshekhariitbhu/go-backend-clean-architecture/domain/domain_app"
	"github.com/amitshekhariitbhu/go-backend-clean-architecture/mongo"
	"go.mongodb.org/mongo-driver/bson"
)

type AppLibraryConfigRepository interface {
	Create(ctx context.Context, configs []*domain_app.AppLibraryConfig) error
	ReplaceAll(ctx context.Context, configs []*domain_app.AppLibraryConfig) error
	GetAll(ctx context.Context) ([]*domain_app.AppLibraryConfig, error)
}

type libraryConfigRepo struct {
	db         mongo.Database
	collection string
}

func NewAppLibraryConfigRepository(db mongo.Database, collection string) AppLibraryConfigRepository {
	return &libraryConfigRepo{db: db, collection: collection}
}

func (r *libraryConfigRepo) ReplaceAll(ctx context.Context, configs []*domain_app.AppLibraryConfig) error {
	coll := r.db.Collection(r.collection)

	if _, err := coll.DeleteMany(ctx, bson.M{}); err != nil {
		return fmt.Errorf("replaceAll failed to delete: %w", err)
	}

	if len(configs) == 0 {
		return nil
	}

	if _, err := coll.InsertMany(ctx, convertToInterfaceSliceAppLibraryConfig(configs)); err != nil {
		return fmt.Errorf("replaceAll failed to insert: %w", err)
	}
	return nil
}
func convertToInterfaceSliceAppLibraryConfig(configs []*domain_app.AppLibraryConfig) []interface{} {
	docs := make([]interface{}, len(configs))
	for i, c := range configs {
		docs[i] = c
	}
	return docs
}

func (r *libraryConfigRepo) Create(ctx context.Context, configs []*domain_app.AppLibraryConfig) error {
	documents := make([]interface{}, len(configs))
	for i, c := range configs {
		documents[i] = c
	}
	_, err := r.db.Collection(r.collection).InsertMany(ctx, documents)
	return err
}

func (r *libraryConfigRepo) GetAll(ctx context.Context) ([]*domain_app.AppLibraryConfig, error) {
	coll := r.db.Collection(r.collection)

	cursor, err := coll.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("find failed: %w", err)
	}
	defer cursor.Close(ctx)

	var configs []*domain_app.AppLibraryConfig
	if err := cursor.All(ctx, &configs); err != nil {
		return nil, fmt.Errorf("decode failed: %w", err)
	}

	if len(configs) == 0 {
		return nil, domain.ErrEmptyCollection
	}
	return configs, nil
}
