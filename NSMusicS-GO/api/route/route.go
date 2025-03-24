package route

import (
	"github.com/amitshekhariitbhu/go-backend-clean-architecture/api/route/route_app/route_app_config"
	"github.com/amitshekhariitbhu/go-backend-clean-architecture/api/route/route_app/route_app_library"
	"github.com/amitshekhariitbhu/go-backend-clean-architecture/api/route/route_auth"
	"github.com/amitshekhariitbhu/go-backend-clean-architecture/api/route/route_file_entity"
	"github.com/amitshekhariitbhu/go-backend-clean-architecture/api/route/route_system"
	"time"

	"github.com/amitshekhariitbhu/go-backend-clean-architecture/api/middleware/middleware_system"

	"github.com/amitshekhariitbhu/go-backend-clean-architecture/bootstrap"
	"github.com/amitshekhariitbhu/go-backend-clean-architecture/mongo"
	"github.com/gin-gonic/gin"
)

func Setup(env *bootstrap.Env, timeout time.Duration, db mongo.Database, gin *gin.Engine) {
	// All Public APIs
	publicRouter := gin.Group("")
	RouterPublic(env, timeout, db, publicRouter)

	// All Private APIs
	protectedRouter := gin.Group("")
	// Middleware to verify AccessToken
	protectedRouter.Use(middleware_system.JwtAuthMiddleware(env.AccessTokenSecret))
	RouterPrivate(env, timeout, db, protectedRouter)
}

func RouterPublic(env *bootstrap.Env, timeout time.Duration, db mongo.Database, publicRouter *gin.RouterGroup) {
	route_auth.NewLoginRouter(env, timeout, db, publicRouter)
}

func RouterPrivate(env *bootstrap.Env, timeout time.Duration, db mongo.Database, protectedRouter *gin.RouterGroup) {
	// auth
	route_auth.NewSignupRouter(env, timeout, db, protectedRouter)
	route_auth.NewRefreshTokenRouter(env, timeout, db, protectedRouter)
	route_auth.NewProfileRouter(timeout, db, protectedRouter)
	route_auth.NewTaskRouter(timeout, db, protectedRouter)
	// system
	route_system.NewSystemInfoRouter(timeout, db, protectedRouter)
	route_system.NewSystemConfigurationRouter(timeout, db, protectedRouter)
	// app config
	route_app_config.NewAppConfigRouter(timeout, db, protectedRouter)
	route_app_config.NewAppLibraryConfigRouter(timeout, db, protectedRouter)
	route_app_config.NewAppAudioConfigRouter(timeout, db, protectedRouter)
	route_app_config.NewAppUIConfigRouter(timeout, db, protectedRouter)
	route_app_config.NewAppPlaylistIDConfigRouter(timeout, db, protectedRouter)
	route_app_config.NewAppServerConfigRouter(timeout, db, protectedRouter)
	// app library
	route_app_library.NewAppMediaFileLibraryRouter(timeout, db, protectedRouter)
	// file entity
	route_file_entity.NewFileEntityRouter(timeout, db, protectedRouter)
}
