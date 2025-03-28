package domain_file_entity_audio_interface

import (
	"context"
	"github.com/amitshekhariitbhu/go-backend-clean-architecture/domain/domain_file_entity/type_audio/domain_file_entity_audio_models"
	"time"
)

// MetadataValidator 数据校验接口
type MetadataValidator interface {
	// 基础校验
	ValidateRequiredFields(file *domain_file_entity_audio_models.MediaFileMetadata) error
	ValidateTechnicalParams(file *domain_file_entity_audio_models.MediaFileMetadata) error

	// 高级校验
	CheckAlbumConsistency(ctx context.Context, albumID string) error
	DetectMetadataConflicts(ctx context.Context, file *domain_file_entity_audio_models.MediaFileMetadata) ([]Conflict, error)
}

// 元数据冲突详情
type Conflict struct {
	FieldName     string
	SourceSystem  string // "local", "mbz", "file"
	CurrentValue  interface{}
	ProposedValue interface{}
	ConflictLevel int // 0-信息 1-警告 2-错误
	Resolution    ConflictResolution
}

type ConflictResolution struct {
	Strategy      string // "auto", "manual"
	SelectedValue interface{}
	ResolvedAt    time.Time
}

//// 专辑一致性检查结果
//type AlbumConsistencyReport struct {
//	MissingTracks   []int
//	DuplicateTracks []struct {
//		TrackNumber int
//		Paths       []string
//	}
//	YearMismatch   bool
//	ArtistMismatch bool
//}
