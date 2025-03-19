package route

import (
	"github.com/amitshekhariitbhu/go-backend-clean-architecture/api/route/route_auth"
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
	route_auth.NewSignupRouter(env, timeout, db, publicRouter)
	route_auth.NewLoginRouter(env, timeout, db, publicRouter)
	route_auth.NewRefreshTokenRouter(env, timeout, db, publicRouter)
}

func RouterPrivate(env *bootstrap.Env, timeout time.Duration, db mongo.Database, protectedRouter *gin.RouterGroup) {
	//
	route_auth.NewProfileRouter(env, timeout, db, protectedRouter)
	route_auth.NewTaskRouter(env, timeout, db, protectedRouter)
	//
	route_system.NewSystemInfoRouter(env, timeout, db, protectedRouter)
	route_system.NewSystemConfigurationRouter(env, timeout, db, protectedRouter)
}
