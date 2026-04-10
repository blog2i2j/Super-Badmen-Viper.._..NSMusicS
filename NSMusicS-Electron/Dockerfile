FROM nginx:1.23.3-alpine

# 安装环境变量替换工具
RUN apk add --no-cache gettext

ENV NGINX_PORT=80
ENV BACKEND_SERVICE=127.0.0.1:3000

# 复制配置模板
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
COPY dist/ /usr/share/nginx/html

# 动态生成配置的入口脚本
COPY docker-entrypoint.sh /
# Normalize Windows CRLF worktrees so Linux containers start reliably on local
# builds and in CI regardless of the host platform.
RUN set -eux; \
    sed -i 's/\r$//' /docker-entrypoint.sh /etc/nginx/conf.d/default.conf.template; \
    chmod 755 /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
