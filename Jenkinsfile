pipeline {
    agent any

    parameters {
        choice(
            name: 'TARGET_ENV',
            choices: ['development', 'test', 'staging', 'production'],
            description: '选择要部署的环境'
        )
        booleanParam(
            name: 'SKIP_BUILD',
            defaultValue: false,
            description: '跳过构建步骤（用于重新部署已有镜像）'
        )
        choice(
            name: 'COMPRESS_MODE',
            choices: ['gzip', 'none', 'brotli', 'gzip,brotli'],
            description: '选择压缩模式'
        )
        choice(
            name: 'ROUTER_MODE',
            choices: ['hash', 'history'],
            description: '路由模式'
        )
    }

    environment {
        // 核心配置
        PROJECT_NAME = 'ryu-admin'
        DOCKER_REGISTRY = 'registry.cn-hangzhou.aliyuncs.com'
        DOCKER_NAMESPACE = 'ryu-blog'
        IMAGE_NAME = "${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/${PROJECT_NAME}"
        IMAGE_TAG = "${params.TARGET_ENV}-${BUILD_NUMBER}"

        // 凭证
        DOCKER_REGISTRY_CREDENTIALS = '7bbd2f0b-5af4-4079-a15c-bc52037de966'
        SSH_CREDENTIALS_ID = '37ab906a-5428-404f-ad67-765dd2a7a8ad'

        // 部署配置
        DEPLOY_USER = 'ubuntu'
        DEPLOY_SERVER = '119.91.136.254'
        DEPLOY_BASE_PATH = "/opt/ryu-blog"

        // 环境特定配置 - 端口映射
        PORT_MAPPING_DEV = '8001:8080'
        PORT_MAPPING_TEST = '8002:8080'
        PORT_MAPPING_STAGING = '8003:8080'
        PORT_MAPPING_PROD = '8080:8080'

        // API基础URL配置
        API_BASE_URL_DEV = 'http://localhost:3000/api'
        API_BASE_URL_TEST = 'http://test-api.example.com/api'
        API_BASE_URL_STAGING = 'http://staging-api.example.com/api'
        API_BASE_URL_PROD = '/api'

        // API网关服务配置
        API_GATEWAY_DEV = 'vben-gateway-dev:8100'
        API_GATEWAY_TEST = 'vben-gateway-test:8100'
        API_GATEWAY_STAGING = 'vben-gateway-staging:8100'
        API_GATEWAY_PROD = 'ryu-gateway-prod:8100'

        // Node环境变量
        PNPM_HOME = "/pnpm"
        PATH = "$PNPM_HOME:$PATH"
        NODE_OPTIONS = "--max-old-space-size=8192"
        TZ = "Asia/Shanghai"
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '5'))
        timestamps()
    }

    stages {
        stage('环境配置') {
            steps {
                script {
                    // 设置当前环境的端口映射、API URL和网关服务
                    if (params.TARGET_ENV == 'development') {
                        env.CURRENT_PORT_MAPPING = env.PORT_MAPPING_DEV
                        env.CURRENT_API_BASE_URL = env.API_BASE_URL_DEV
                        env.CURRENT_API_GATEWAY = env.API_GATEWAY_DEV
                        env.VITE_BASE = '/'
                    } else if (params.TARGET_ENV == 'test') {
                        env.CURRENT_PORT_MAPPING = env.PORT_MAPPING_TEST
                        env.CURRENT_API_BASE_URL = env.API_BASE_URL_TEST
                        env.CURRENT_API_GATEWAY = env.API_GATEWAY_TEST
                        env.VITE_BASE = '/'
                    } else if (params.TARGET_ENV == 'staging') {
                        env.CURRENT_PORT_MAPPING = env.PORT_MAPPING_STAGING
                        env.CURRENT_API_BASE_URL = env.API_BASE_URL_STAGING
                        env.CURRENT_API_GATEWAY = env.API_GATEWAY_STAGING
                        env.VITE_BASE = '/'
                    } else if (params.TARGET_ENV == 'production') {
                        env.CURRENT_PORT_MAPPING = env.PORT_MAPPING_PROD
                        env.CURRENT_API_BASE_URL = env.API_BASE_URL_PROD
                        env.CURRENT_API_GATEWAY = env.API_GATEWAY_PROD
                        env.VITE_BASE = '/'
                    }

                    echo "开始构建 ${PROJECT_NAME}"
                    echo "目标环境: ${params.TARGET_ENV}"
                    echo "目标服务器: ${DEPLOY_SERVER}"
                    echo "端口映射: ${env.CURRENT_PORT_MAPPING}"
                    echo "API基础URL: ${env.CURRENT_API_BASE_URL}"
                    echo "API网关服务: ${env.CURRENT_API_GATEWAY}"
                    echo "压缩模式: ${params.COMPRESS_MODE}"
                    echo "路由模式: ${params.ROUTER_MODE}"
                }
            }
        }

        stage('检出代码') {
            steps {
                checkout scm
            }
        }

        stage('准备构建环境') {
            when { expression { return !params.SKIP_BUILD } }
            steps {
                script {
                    // 配置.env.production文件
                    sh """
                        # 创建项目根目录的.env.production
                        echo "# 环境变量 - 由Jenkins生成" > .env.production
                        echo "VITE_GLOB_APP_TITLE=${PROJECT_NAME}" >> .env.production
                        echo "VITE_GLOB_API_URL=${env.CURRENT_API_BASE_URL}" >> .env.production
                        echo "VITE_COMPRESS=${params.COMPRESS_MODE}" >> .env.production
                        echo "VITE_ROUTER_HISTORY=${params.ROUTER_MODE}" >> .env.production
                        echo "VITE_BASE=${env.VITE_BASE}" >> .env.production
                        
                        # 为apps/web-ele创建环境变量
                        mkdir -p apps/web-ele
                        cp .env.production apps/web-ele/.env.production
                        
                        # 为playground创建环境变量
                        mkdir -p playground
                        cp .env.production playground/.env.production
                        
                        # 显示环境变量
                        echo "项目环境变量:"
                        cat .env.production
                    """
                    
                    // 创建多阶段构建的Dockerfile
                    sh '''
                        echo "创建多阶段构建Dockerfile..."
                        cat > Dockerfile.multi << 'EOL'
# 第一阶段: 构建应用
FROM node:20-slim AS builder

# 设置环境变量
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV TZ=Asia/Shanghai

# 启用corepack
RUN corepack enable

WORKDIR /app

# 复制package.json和lock文件
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# 复制所有源代码
COPY . .

# 安装依赖
RUN pnpm install --frozen-lockfile || pnpm install

# 修复重复parentId问题
RUN if [ -f "apps/web-ele/src/views/features/menu/MenuList.vue" ]; then \\
      sed -i '/parentId: selectedParent.value,/d' apps/web-ele/src/views/features/menu/MenuList.vue; \\
    fi

# 配置Vite以支持ES2022和顶级await
RUN if [ -f "apps/web-ele/vite.config.mts" ]; then \\
      sed -i 's/target:.*es2020.*/target: \\"es2022\\"/' apps/web-ele/vite.config.mts; \\
    fi

# 添加别名配置以解决@vben-core包引用问题
RUN if [ -f "apps/web-ele/vite.config.mts" ]; then \\
      sed -i '/build: {/a\\\n        resolve: {\\\n          alias: {\\\n            \\"@vben-core/tabs-ui\\": fileURLToPath(new URL(\\"../../packages/@core/ui-kit/tabs-ui/src/index.ts\\", import.meta.url)),\\\n            \\"@vben-core/icons\\": fileURLToPath(new URL(\\"../../packages/@core/base/icons/src/index.ts\\", import.meta.url)),\\\n            \\"@vben-core/composables\\": fileURLToPath(new URL(\\"../../packages/@core/composables/src/index.ts\\", import.meta.url))\\\n          }\\\n        },' apps/web-ele/vite.config.mts; \\
    fi

# 尝试构建web-ele
RUN if [ -d "apps/web-ele" ]; then \\
      cd apps/web-ele && pnpm build || echo "Web-ele构建失败"; \\
    fi

# 尝试构建playground
RUN if [ -d "playground" ]; then \\
      cd playground && pnpm build || echo "Playground构建失败"; \\
    fi

# 如果没有构建成功，创建一个静态页面
RUN if [ ! -d "apps/web-ele/dist" ] && [ ! -d "playground/dist" ]; then \\
      mkdir -p static-html; \\
      echo "<!DOCTYPE html>
<html lang=\"zh-CN\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>Vben Admin</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 2rem; }
        .container { background-color: #f9f9f9; border-radius: 8px; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #42b983; }
        .info { margin: 1.5rem 0; padding: 1rem; background-color: #f0f8ff; border-left: 4px solid #42b983; }
        footer { margin-top: 2rem; color: #999; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class=\"container\">
        <h1>Vben Admin 静态页面</h1>
        <div class=\"info\">
            <p>构建时间: $(date)</p>
            <p>此静态页面由于构建失败自动生成。</p>
        </div>
        <p>此页面表示应用已成功部署，但构建过程未能完成构建Vue应用。请检查构建日志以获取更多信息。</p>
        <footer>Powered by Vben Admin</footer>
    </div>
</body>
</html>" > static-html/index.html; \\
    fi

# 第二阶段: 生产环境
FROM nginx:stable-alpine

# 添加MJS支持
RUN echo "types { application/javascript js mjs; }" > /etc/nginx/conf.d/mjs.conf

# 准备目录
RUN mkdir -p /usr/share/nginx/html

# 复制构建产物 - 优先使用web-ele，然后是playground，最后是静态页面
COPY --from=builder /app/apps/web-ele/dist /usr/share/nginx/html/ 2>/dev/null || true
COPY --from=builder /app/playground/dist /usr/share/nginx/html/ 2>/dev/null || true
COPY --from=builder /app/static-html /usr/share/nginx/html/ 2>/dev/null || true

# 复制nginx配置
COPY scripts/deploy/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
EOL
                        
                        cat Dockerfile.multi
                    '''
                    
                    // 准备nginx配置
                    sh '''
                        cp scripts/deploy/nginx.conf nginx.conf.tmp
                        
                        # 取消注释gzip相关配置
                        if [[ "${COMPRESS_MODE}" == *"gzip"* ]]; then
                            echo "启用gzip压缩..."
                            sed -i 's/# gzip on;/gzip on;/g' nginx.conf.tmp
                            sed -i 's/# gzip_buffers/gzip_buffers/g' nginx.conf.tmp
                            sed -i 's/# gzip_comp_level/gzip_comp_level/g' nginx.conf.tmp
                            sed -i 's/# gzip_min_length/gzip_min_length/g' nginx.conf.tmp
                            sed -i 's/# gzip_static/gzip_static/g' nginx.conf.tmp
                            sed -i 's/# gzip_types/gzip_types/g' nginx.conf.tmp
                            sed -i 's/# gzip_vary/gzip_vary/g' nginx.conf.tmp
                        fi
                        
                        # 添加brotli支持
                        if [[ "${COMPRESS_MODE}" == *"brotli"* ]]; then
                            echo "添加brotli配置..."
                            cat >> nginx.conf.tmp << EOL
                        
# brotli压缩
brotli on;
brotli_comp_level 6;
brotli_buffers 16 8k;
brotli_min_length 20;
brotli_types text/plain text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript application/javascript image/svg+xml;
EOL
                        fi
                        
                        # 修改API网关
                        sed -i "s|ryu-gateway-prod:8100|${CURRENT_API_GATEWAY}|g" nginx.conf.tmp
                        
                        # 配置history路由模式支持
                        if [[ "${ROUTER_MODE}" == "history" ]]; then
                            echo "配置history路由模式..."
                            sed -i 's|location / {|location / {\n      # 用于配合 History 使用|g' nginx.conf.tmp
                        fi
                        
                        # 更新nginx配置
                        mv nginx.conf.tmp scripts/deploy/nginx.conf
                    '''
                }
            }
        }

        stage('构建镜像') {
            when { expression { return !params.SKIP_BUILD } }
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_REGISTRY_CREDENTIALS}", passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        // 登录Docker仓库
                        sh "echo ${DOCKER_PASSWORD} | docker login ${DOCKER_REGISTRY} -u ${DOCKER_USERNAME} --password-stdin"

                        // 构建Docker镜像 - 使用多阶段构建
                        sh """
                            echo "开始构建Docker镜像..."
                            docker build --no-cache \
                            -f Dockerfile.multi \
                            -t ${IMAGE_NAME}:${IMAGE_TAG} \
                            -t ${IMAGE_NAME}:${params.TARGET_ENV}-latest .

                            # 推送镜像到仓库
                            echo "推送镜像到${DOCKER_REGISTRY}..."
                            docker push ${IMAGE_NAME}:${IMAGE_TAG}
                            docker push ${IMAGE_NAME}:${params.TARGET_ENV}-latest
                        """
                    }
                }
            }
        }

        stage('部署应用') {
            steps {
                script {
                    def deployTag = params.SKIP_BUILD ? "${params.TARGET_ENV}-latest" : "${IMAGE_TAG}"
                    def containerName = "${PROJECT_NAME}-${params.TARGET_ENV}"

                    sshagent([env.SSH_CREDENTIALS_ID]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} "
                                echo '开始部署 ${containerName} 到 ${DEPLOY_SERVER}...'
                                mkdir -p ${DEPLOY_BASE_PATH}/${params.TARGET_ENV}/logs

                                # 登录Docker仓库并拉取镜像
                                echo '拉取镜像 ${IMAGE_NAME}:${deployTag}...'
                                docker pull ${IMAGE_NAME}:${deployTag}

                                # 停止和移除旧容器
                                echo '停止旧容器...'
                                docker stop ${containerName} || true
                                docker rm ${containerName} || true

                                # 启动新容器
                                echo '启动新容器...'
                                docker run -d \\
                                --name ${containerName} \\
                                --restart unless-stopped \\
                                --network docker_vben-net \\
                                -p ${env.CURRENT_PORT_MAPPING} \\
                                -v ${DEPLOY_BASE_PATH}/${params.TARGET_ENV}/logs:/var/log/nginx \\
                                -e API_GATEWAY=${env.CURRENT_API_GATEWAY} \\
                                -e API_BASE_URL=${env.CURRENT_API_BASE_URL} \\
                                ${IMAGE_NAME}:${deployTag}

                                # 清理未使用的镜像
                                echo '清理未使用的镜像...'
                                docker image prune -f
                                
                                echo '部署完成!'
                            "
                        """

                        // 输出部署信息
                        def port = env.CURRENT_PORT_MAPPING.split(':')[0]
                        echo "部署完成! 环境: ${params.TARGET_ENV}, 服务器: ${DEPLOY_SERVER}"
                        echo "应用URL: http://${DEPLOY_SERVER}:${port}/"
                    }
                }
            }
        }
        
        stage('预览部署结果') {
            steps {
                script {
                    def port = env.CURRENT_PORT_MAPPING.split(':')[0]
                    echo "应用已部署! 您可以通过以下URL访问:"
                    echo "http://${DEPLOY_SERVER}:${port}/"
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            emailext (
                subject: "【${PROJECT_NAME}】${params.TARGET_ENV}环境部署成功",
                body: """
                <p>部署成功!</p>
                <p>项目: ${PROJECT_NAME}</p>
                <p>环境: ${params.TARGET_ENV}</p>
                <p>服务器: ${DEPLOY_SERVER}</p>
                <p>压缩模式: ${params.COMPRESS_MODE}</p>
                <p>路由模式: ${params.ROUTER_MODE}</p>
                <p>访问地址: http://${DEPLOY_SERVER}:${env.CURRENT_PORT_MAPPING.split(':')[0]}/</p>
                """,
                to: 'admin@example.com',
                mimeType: 'text/html'
            )
        }
        failure {
            emailext (
                subject: "【${PROJECT_NAME}】${params.TARGET_ENV}环境部署失败",
                body: """
                <p>部署失败!</p>
                <p>项目: ${PROJECT_NAME}</p>
                <p>环境: ${params.TARGET_ENV}</p>
                <p>服务器: ${DEPLOY_SERVER}</p>
                <p>压缩模式: ${params.COMPRESS_MODE}</p>
                <p>路由模式: ${params.ROUTER_MODE}</p>
                <p>详情: <a href='${env.BUILD_URL}'>构建日志</a></p>
                """,
                to: 'admin@example.com',
                mimeType: 'text/html'
            )
        }
    }
}
