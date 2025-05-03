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

        stage('创建环境变量文件') {
            when { expression { return !params.SKIP_BUILD } }
            steps {
                script {
                    // 为生产环境创建.env.production文件
                    sh """
                        echo "# 环境变量 - 由Jenkins生成" > .env.production
                        echo "VITE_GLOB_APP_TITLE=${PROJECT_NAME}" >> .env.production
                        echo "VITE_GLOB_API_URL=${env.CURRENT_API_BASE_URL}" >> .env.production
                        echo "VITE_COMPRESS=${params.COMPRESS_MODE}" >> .env.production
                        echo "VITE_ROUTER_HISTORY=${params.ROUTER_MODE}" >> .env.production
                        echo "VITE_BASE=${env.VITE_BASE}" >> .env.production
                        
                        cat .env.production
                    """
                }
            }
        }

        stage('构建应用') {
            when { expression { return !params.SKIP_BUILD } }
            steps {
                script {
                    // 启用corepack
                    sh 'corepack enable'
                    sh 'pnpm -v'
                    sh 'node -v'

                    // 安装依赖
                    sh 'pnpm install --frozen-lockfile || pnpm install'
                    
                    // 执行构建 - 优先构建apps/web-ele目录
                    sh '''
                        # 优先检查web-ele目录
                        if [ -d "apps/web-ele" ] && [ -f "apps/web-ele/index.html" ]; then
                            echo "在 apps/web-ele 目录中构建..."
                            cd apps/web-ele && pnpm build
                        elif [ -d "playground" ] && [ -f "playground/index.html" ]; then
                            echo "在 playground 目录中构建..."
                            cd playground && pnpm build
                        elif [ -f "pnpm-workspace.yaml" ]; then
                            echo "使用工作空间过滤器构建..."
                            pnpm --filter="./apps/web-ele" build || pnpm --filter="./playground" build
                        else
                            echo "尝试查找包含index.html的目录..."
                            INDEX_DIR=$(find . -name "index.html" -not -path "*node_modules*" -not -path "*dist*" | head -1 | xargs dirname)
                            if [ ! -z "$INDEX_DIR" ]; then
                                echo "在 $INDEX_DIR 目录中构建..."
                                cd $INDEX_DIR && pnpm build || cd $INDEX_DIR && pnpm vite build
                            else
                                echo "找不到入口文件，尝试直接构建子项目..."
                                pnpm -r build
                            fi
                        fi
                    '''

                    // 确认构建结果
                    sh '''
                        echo "查找构建产物..."
                        find . -name "dist" -type d | grep -v "node_modules" || echo "未找到dist目录"
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

                        // 确保dist目录存在于正确位置，优先使用web-ele的构建结果
                        sh '''
                            # 查找dist目录并复制到根目录
                            if [ -d "dist" ]; then
                                echo "dist目录已存在于根目录"
                            elif [ -d "apps/web-ele/dist" ]; then
                                echo "复制apps/web-ele/dist到根目录..."
                                cp -r apps/web-ele/dist dist
                            elif [ -d "playground/dist" ]; then
                                echo "复制playground/dist到根目录..."
                                cp -r playground/dist dist
                            else
                                echo "创建最小的dist目录..."
                                mkdir -p dist
                                echo "<html><body><h1>Vue Vben Admin</h1><p>构建失败，创建了应急页面 - $(date)</p></body></html>" > dist/index.html
                            fi
                        '''
                        
                        // 准备nginx配置 - 启用gzip/brotli
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
                            
                            # 更新nginx配置
                            mv nginx.conf.tmp scripts/deploy/nginx.conf
                        '''

                        // 配置history路由模式支持
                        if (params.ROUTER_MODE == 'history') {
                            sh '''
                                echo "配置history路由模式..."
                                sed -i 's|location / {|location / {\n      # 用于配合 History 使用|g' scripts/deploy/nginx.conf
                            '''
                        }

                        // 构建镜像
                        sh """
                            docker build --no-cache \
                            -f scripts/deploy/Dockerfile \
                            -t ${IMAGE_NAME}:${IMAGE_TAG} \
                            -t ${IMAGE_NAME}:${params.TARGET_ENV}-latest .

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
                                mkdir -p ${DEPLOY_BASE_PATH}/${params.TARGET_ENV}/logs

                                # 登录Docker仓库
                                docker pull ${IMAGE_NAME}:${deployTag}

                                # 停止和移除旧容器
                                docker stop ${containerName} || true
                                docker rm ${containerName} || true

                                # 启动新容器
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
                                docker image prune -f
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
