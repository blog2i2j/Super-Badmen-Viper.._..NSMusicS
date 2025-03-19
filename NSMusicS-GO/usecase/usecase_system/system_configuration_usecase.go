package usecase_system

import (
	"context"
	"time"

	"github.com/amitshekhariitbhu/go-backend-clean-architecture/domain/domain_system"
	"github.com/amitshekhariitbhu/go-backend-clean-architecture/repository/repository_system"
)

type systemConfigurationUsecase struct {
	repo    repository_system.SystemConfigurationRepository
	timeout time.Duration
}

func NewSystemConfigurationUsecase(repo repository_system.SystemConfigurationRepository, timeout time.Duration) domain_system.SystemConfigurationUsecase {
	return &systemConfigurationUsecase{repo: repo, timeout: timeout}
}

func (uc *systemConfigurationUsecase) Get(ctx context.Context) (*domain_system.SystemConfigurationResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, uc.timeout)
	defer cancel()

	config, err := uc.repo.Find(ctx)
	if err != nil {
		return nil, err
	}

	return &domain_system.SystemConfigurationResponse{
		ID:                                 config.ID.Hex(),
		EnableMetrics:                      config.EnableMetrics,
		EnableNormalizedItemByNameIds:      config.EnableNormalizedItemByNameIds,
		IsPortAuthorized:                   config.IsPortAuthorized,
		QuickConnectAvailable:              config.QuickConnectAvailable,
		EnableCaseSensitiveItemIds:         config.EnableCaseSensitiveItemIds,
		DisableLiveTvChannelUserDataName:   config.DisableLiveTvChannelUserDataName,
		MetadataPath:                       config.MetadataPath,
		PreferredMetadataLanguage:          config.PreferredMetadataLanguage,
		MetadataCountryCode:                config.MetadataCountryCode,
		SortReplaceCharacters:              config.SortReplaceCharacters,
		SortRemoveCharacters:               config.SortRemoveCharacters,
		SortRemoveWords:                    config.SortRemoveWords,
		MinResumePct:                       config.MinResumePct,
		MaxResumePct:                       config.MaxResumePct,
		MinResumeDurationSeconds:           config.MinResumeDurationSeconds,
		MinAudiobookResume:                 config.MinAudiobookResume,
		MaxAudiobookResume:                 config.MaxAudiobookResume,
		InactiveSessionThreshold:           config.InactiveSessionThreshold,
		LibraryMonitorDelay:                config.LibraryMonitorDelay,
		LibraryUpdateDuration:              config.LibraryUpdateDuration,
		ImageSavingConvention:              config.ImageSavingConvention,
		MetadataOptions:                    convertMetadataOptions(config.MetadataOptions),
		SkipDeserializationForBasicTypes:   config.SkipDeserializationForBasicTypes,
		ServerName:                         config.ServerName,
		UICulture:                          config.UICulture,
		SaveMetadataHidden:                 config.SaveMetadataHidden,
		ContentTypes:                       convertContentTypes(config.ContentTypes),
		RemoteClientBitrateLimit:           config.RemoteClientBitrateLimit,
		EnableFolderView:                   config.EnableFolderView,
		EnableGroupingIntoCollections:      config.EnableGroupingIntoCollections,
		DisplaySpecialsWithinSeasons:       config.DisplaySpecialsWithinSeasons,
		CodecsUsed:                         config.CodecsUsed,
		PluginRepositories:                 convertPluginRepositories(config.PluginRepositories),
		EnableExternalContentInSuggestions: config.EnableExternalContentInSuggestions,
		ImageExtractionTimeoutMs:           config.ImageExtractionTimeoutMs,
		PathSubstitutions:                  convertPathSubstitutions(config.PathSubstitutions),
		EnableSlowResponseWarning:          config.EnableSlowResponseWarning,
		SlowResponseThresholdMs:            int(config.SlowResponseThresholdMs),
		CorsHosts:                          config.CorsHosts,
		ActivityLogRetentionDays:           config.ActivityLogRetentionDays,
		LibraryScanFanoutConcurrency:       config.LibraryScanFanoutConcurrency,
		LibraryMetadataRefreshConcurrency:  config.LibraryMetadataRefreshConcurrency,
		RemoveOldPlugins:                   config.RemoveOldPlugins,
		AllowClientLogUpload:               config.AllowClientLogUpload,
		DummyChapterDuration:               config.DummyChapterDuration,
		ChapterImageResolution:             config.ChapterImageResolution,
		ParallelImageEncodingLimit:         config.ParallelImageEncodingLimit,
		CastReceiverApplications:           convertCastApps(config.CastReceiverApplications),
		TrickplayOptions:                   convertTrickplayConfig(config.TrickplayOptions),
		LogFileRetentionDays:               config.LogFileRetentionDays,
		IsStartupWizardCompleted:           config.IsStartupWizardCompleted,
	}, nil
}
func convertContentTypes(contentTypes []domain_system.ContentType) []domain_system.ContentTypeResponse {
	var result []domain_system.ContentTypeResponse
	for _, ct := range contentTypes {
		result = append(result, domain_system.ContentTypeResponse{
			Name:  ct.Name,
			Value: ct.Value,
		})
	}
	return result
}
func convertMetadataOptions(options []domain_system.MetadataOption) []domain_system.MetadataOptionResponse {
	var result []domain_system.MetadataOptionResponse
	for _, opt := range options {
		result = append(result, domain_system.MetadataOptionResponse{
			ItemType:                 opt.ItemType,
			DisabledMetadataSavers:   opt.DisabledMetadataSavers,
			LocalMetadataReaderOrder: opt.LocalMetadataReaderOrder,
			DisabledMetadataFetchers: opt.DisabledMetadataFetchers,
			MetadataFetcherOrder:     opt.MetadataFetcherOrder,
			DisabledImageFetchers:    opt.DisabledImageFetchers,
			ImageFetcherOrder:        opt.ImageFetcherOrder,
		})
	}
	return result
}
func convertPluginRepositories(repos []domain_system.Repository) []domain_system.RepositoryResponse {
	var result []domain_system.RepositoryResponse
	for _, repo := range repos {
		result = append(result, domain_system.RepositoryResponse{
			Name:    repo.Name,
			Url:     repo.Url,
			Enabled: repo.Enabled,
		})
	}
	return result
}
func convertPathSubstitutions(subs []domain_system.PathSubstitution) []domain_system.PathSubstitutionResponse {
	var result []domain_system.PathSubstitutionResponse
	for _, sub := range subs {
		result = append(result, domain_system.PathSubstitutionResponse{
			From: sub.From,
			To:   sub.To,
		})
	}
	return result
}
func convertCastApps(apps []domain_system.CastApp) []domain_system.CastAppResponse {
	var result []domain_system.CastAppResponse
	for _, app := range apps {
		result = append(result, domain_system.CastAppResponse{
			Id:   app.Id,
			Name: app.Name,
		})
	}
	return result
}
func convertTrickplayConfig(config domain_system.TrickplayConfig) domain_system.TrickplayConfigResponse {
	return domain_system.TrickplayConfigResponse{
		EnableHwAcceleration:         config.EnableHwAcceleration,
		EnableHwEncoding:             config.EnableHwEncoding,
		EnableKeyFrameOnlyExtraction: config.EnableKeyFrameOnlyExtraction,
		ScanBehavior:                 config.ScanBehavior,
		ProcessPriority:              config.ProcessPriority,
		Interval:                     config.Interval,
		WidthResolutions:             config.WidthResolutions,
		TileWidth:                    config.TileWidth,
		TileHeight:                   config.TileHeight,
		Qscale:                       config.Qscale,
		JpegQuality:                  config.JpegQuality,
		ProcessThreads:               config.ProcessThreads,
	}
}

func (uc *systemConfigurationUsecase) Update(ctx context.Context, config *domain_system.SystemConfiguration) error {
	ctx, cancel := context.WithTimeout(ctx, uc.timeout)
	defer cancel()
	return uc.repo.Update(ctx, config)
}
