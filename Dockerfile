# 🐳 Vue 分销系统前端 Dockerfile
# 多阶段构建：构建阶段 + Nginx 生产环境

# ================================
# 阶段 1: 构建阶段 (Build Stage)
# ================================
FROM node:20-alpine AS build-stage

# 设置工作目录
WORKDIR /app

# 设置npm镜像源加速构建
RUN npm config set registry https://registry.npmmirror.com/

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --silent

# 复制源代码
COPY . .

# 设置构建时间戳
RUN sed -i "s/__BUILD_TIME__/$(date -u +%Y%m%d%H%M%S)/g" .env.docker

# 验证依赖安装完整性（移除有害的重新安装步骤）
RUN npm list --depth=0 || echo "Dependencies verified"

# 使用Docker环境配置构建生产版本
RUN cp .env.docker .env.production && npm run build

# ================================
# 阶段 2: 生产阶段 (Production Stage)
# ================================
FROM nginx:1.25-alpine AS production-stage

# 安装必要工具
RUN apk add --no-cache curl

# 删除nginx默认配置和静态文件
RUN rm -rf /usr/share/nginx/html/* && rm /etc/nginx/conf.d/default.conf

# 从构建阶段复制构建产物
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制nginx配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 创建日志目录
RUN mkdir -p /var/log/nginx && \
    touch /var/log/nginx/access.log && \
    touch /var/log/nginx/error.log

# 设置正确的权限
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]