pipeline {
  agent any

    parameters {
        choice(
            name: 'TARGET_ENV',
            choices: ['development', 'test', 'staging', 'production'],
            description: '部署环境'
        )
        choice(
            name: 'COMPRESS_MODE',
            choices: ['gzip', 'none', 'brotli', 'gzip,brotli'],
            description: '资源压缩模式'
        )
        choice(
            name: 'ROUTER_MODE',
            choices: ['hash', 'history'],
            description: '路由模式'
        )
    }

    environment {
        // 项目配置
        PROJECT_NAME = 'ryu-admin'

        // Docker配置
        DOCKER_REGISTRY = 'registry.cn-hangzhou.aliyuncs.com'
        DOCKER_NAMESPACE = 'ryu-blog'
        IMAGE_NAME = "${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/${PROJECT_NAME}"
        IMAGE_TAG = "${params.TARGET_ENV}-${BUILD_NUMBER}"

        // 部署配置
        DEPLOY_SERVER = '119.91.136.254'
        DEPLOY_PATH = "/opt/ryu-blog-/admin/${params.TARGET_ENV}"

        // Node环境变量
        NODE_OPTIONS = "--max-old-space-size=8192"
        TZ = "Asia/Shanghai"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {
        stage('初始化环境') {
            steps {
                echo "正在初始化构建环境..."
                sh 'corepack enable'
                sh 'pnpm --version || npm install -g pnpm'
                sh 'node --version'
                sh 'pnpm --version'

                // 设置环境变量文件
                script {
                    def apiUrl = params.TARGET_ENV == 'production' ? '/api' : "http://${params.TARGET_ENV}-api.vben.io/api"

                    writeFile file: ".env.${params.TARGET_ENV}", text: """
                        # 构建环境变量
                        VITE_GLOB_APP_TITLE=${PROJECT_NAME}
                        VITE_GLOB_API_URL=${apiUrl}
                        VITE_COMPRESS=${params.COMPRESS_MODE}
                        VITE_ROUTER_HISTORY=${params.ROUTER_MODE}
                        VITE_BASE=/
                    """
                }
            }
        }

        stage('获取代码') {
            steps {
                checkout scm
            }
        }

        stage('修复配置文件') {
            steps {
                echo "修复nginx配置文件..."
                
                // 修复nginx.conf中的语法问题（删除多余的分号）
                sh '''
                    # 移除nginx.conf中多余的分号
                    sed -i 's/;\\s*add_header/add_header/g' scripts/deploy/nginx.conf
                    sed -i 's/;\\s*if/if/g' scripts/deploy/nginx.conf
                '''
                
                // 根据环境参数启用或禁用gzip压缩
                script {
                    if (params.COMPRESS_MODE.contains('gzip')) {
                        sh '''
                            # 启用gzip压缩
                            sed -i 's/# gzip on;/gzip on;/g' scripts/deploy/nginx.conf
                            sed -i 's/# gzip_buffers/gzip_buffers/g' scripts/deploy/nginx.conf
                            sed -i 's/# gzip_comp_level/gzip_comp_level/g' scripts/deploy/nginx.conf
                            sed -i 's/# gzip_min_length/gzip_min_length/g' scripts/deploy/nginx.conf
                            sed -i 's/# gzip_static/gzip_static/g' scripts/deploy/nginx.conf
                            sed -i 's/# gzip_types/gzip_types/g' scripts/deploy/nginx.conf
                            sed -i 's/# gzip_vary/gzip_vary/g' scripts/deploy/nginx.conf
                        '''
                    }
                }
                
                // 添加健康检查配置到nginx.conf
                sh '''
                    # 检查是否已有健康检查配置
                    if ! grep -q "location /health" scripts/deploy/nginx.conf; then
                        # 在server块中添加健康检查配置
                        sed -i '/server {/a \\    # 健康检查\\n    location /health {\\n        access_log off;\\n        return 200 "ok";\\n    }' scripts/deploy/nginx.conf
                    fi
                '''
            }
        }

        stage('安装依赖') {
            steps {
                echo "安装项目依赖..."
                sh '''
                    # 在根目录安装所有依赖，允许更新锁文件
                    pnpm install --no-frozen-lockfile
                '''
            }
        }

        stage('构建内部依赖') {
            steps {
                echo "构建内部依赖包..."
                sh '''
                    # 先构建基础内部工具包
                    pnpm --filter="@vben/tsconfig" build
                    pnpm --filter="@vben/vite-config" build
                    pnpm --filter="@vben/node-utils" build
                    pnpm --filter="@vben/tailwind-config" build
                    pnpm --filter="@vben-core/*" build
                    
                    # 再构建其他内部包
                    pnpm --filter=./internal build
                    pnpm --filter=./packages build
                    
                    # 构建effects目录下的包
                    pnpm --filter=./packages/effects build
                '''
            }
        }

        stage('构建应用') {
            steps {
                echo "构建web-ele应用..."
                sh '''
                    # 构建web-ele应用
                    cd apps/web-ele && pnpm build
                '''
            }
        }

        stage('构建Docker镜像') {
            steps {
                echo "构建Docker镜像..."

                // 修改Dockerfile确保正确使用构建结果
                script {
                    // 创建新的Dockerfile来使用web-ele的构建结果
                    writeFile file: "scripts/deploy/Dockerfile.new", text: """
FROM node:20-slim AS builder

# --max-old-space-size
ENV PNPM_HOME="/pnpm"
ENV PATH="\$PNPM_HOME:\$PATH"
ENV NODE_OPTIONS=--max-old-space-size=8192
ENV TZ=Asia/Shanghai

RUN corepack enable

WORKDIR /app

# copy package.json and pnpm-lock.yaml to workspace
COPY . /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

# 先构建基础内部工具包
RUN pnpm --filter="@vben/tsconfig" build
RUN pnpm --filter="@vben/vite-config" build
RUN pnpm --filter="@vben/node-utils" build
RUN pnpm --filter="@vben/tailwind-config" build
RUN pnpm --filter="@vben-core/*" build

# 再构建其他内部包
RUN pnpm --filter=./internal build
RUN pnpm --filter=./packages build

# 构建effects目录下的包
RUN pnpm --filter=./packages/effects build

# 最后构建web-ele应用
RUN cd apps/web-ele && pnpm build

RUN echo "Builder Success 🎉"

FROM nginx:stable-alpine AS production

RUN echo "types { application/javascript js mjs; }" > /etc/nginx/conf.d/mjs.conf
COPY --from=builder /app/apps/web-ele/dist /usr/share/nginx/html

COPY --from=builder /app/scripts/deploy/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

# start nginx
CMD ["nginx", "-g", "daemon off;"]
"""
                    
                    sh 'mv scripts/deploy/Dockerfile.new scripts/deploy/Dockerfile'
                }

                // 构建镜像
                withCredentials([usernamePassword(credentialsId: '7bbd2f0b-5af4-4079-a15c-bc52037de966',
                                               passwordVariable: 'DOCKER_PASSWORD',
                                               usernameVariable: 'DOCKER_USERNAME')]) {
                    sh """
                        echo ${DOCKER_PASSWORD} | docker login ${DOCKER_REGISTRY} -u ${DOCKER_USERNAME} --password-stdin
                        # 使用DOCKER_BUILDKIT加速构建过程
                        DOCKER_BUILDKIT=1 docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -f scripts/deploy/Dockerfile .
                        docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:${params.TARGET_ENV}-latest
                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${IMAGE_NAME}:${params.TARGET_ENV}-latest
                    """
                }
            }
        }

        stage('部署应用') {
            steps {
                echo "部署应用到${params.TARGET_ENV}环境..."

                sshagent(['37ab906a-5428-404f-ad67-765dd2a7a8ad']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_SERVER} << EOC
                        set -e
                        mkdir -p ${DEPLOY_PATH}

                        # 拉取最新镜像
                        docker pull ${IMAGE_NAME}:${IMAGE_TAG}

                        # 停止并删除旧容器
                        docker stop ${PROJECT_NAME}-${params.TARGET_ENV} || true
                        docker rm ${PROJECT_NAME}-${params.TARGET_ENV} || true

                        # 启动新容器
                        docker run -d \\
                          --name ${PROJECT_NAME}-${params.TARGET_ENV} \\
                          --restart always \\
                          -p 80:8080 \\
                          --health-cmd='wget -q -O /dev/null http://localhost:8080/health || exit 1' \\
                          --health-interval=30s \\
                          --health-retries=3 \\
                          --health-timeout=10s \\
                          -v ${DEPLOY_PATH}/logs:/var/log/nginx \\
                          ${IMAGE_NAME}:${IMAGE_TAG}

                        # 清理无用镜像（保留最近5个版本）
                        docker image ls ${IMAGE_NAME} --format '{{.Repository}}:{{.Tag}}' | grep '${params.TARGET_ENV}-[0-9]*' | sort -r | tail -n +6 | xargs -r docker rmi
                        
                        # 清理未被使用的镜像
                        docker image prune -f
                        
                        # 验证应用是否正常启动
                        echo "等待应用启动..."
                        sleep 5
                        
                        # 检查健康状态
                        HEALTH_STATUS=\$(docker inspect --format='{{.State.Health.Status}}' ${PROJECT_NAME}-${params.TARGET_ENV})
                        if [ "\$HEALTH_STATUS" = "healthy" ] || [ "\$HEALTH_STATUS" = "starting" ]; then
                            echo "应用已成功部署并处于健康状态"
                        else
                            echo "警告：应用可能未正常启动，当前状态：\$HEALTH_STATUS"
                        fi
                        EOC
                    """
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "构建成功！应用已部署到${params.TARGET_ENV}环境"
            slackSend(color: 'good',
                     message: "${PROJECT_NAME} ${params.TARGET_ENV}环境部署成功! 版本: ${IMAGE_TAG}")
        }
        failure {
            echo "构建失败！请检查日志"
            slackSend(color: 'danger',
                     message: "${PROJECT_NAME} ${params.TARGET_ENV}环境部署失败! 详情: ${BUILD_URL}")
        }
    }
}
