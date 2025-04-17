<template>
  <div class="cloud-drive">
    <!-- 顶部导航栏 -->
    <div class="cloud-drive-header">
      <h2 class="drive-title">个人网盘</h2>
      <div class="header-actions">
        <div class="storage-info">
          <div class="storage-progress">
            <el-progress :percentage="storageInfo.percentage" :stroke-width="8"/>
          </div>
          <span class="storage-text">已使用 {{ formatSize(storageInfo.used) }}/{{
              formatSize(storageInfo.total)
            }}</span>
        </div>
        <div class="header-buttons">
          <el-button circle @click="toggleDarkMode">
            <el-icon>
              <component :is="isDarkMode ? 'Sunny' : 'Moon'"/>
            </el-icon>
          </el-button>
          <el-button circle @click="openSettings">
            <el-icon>
              <Setting/>
            </el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <div class="cloud-drive-container">
      <!-- 左侧菜单 -->
      <div class="cloud-drive-sidebar">
        <el-menu
          :default-active="activeMenu"
          class="cloud-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="all">
            <el-icon>
              <Folder/>
            </el-icon>
            <span>全部文件</span>
          </el-menu-item>
          <el-menu-item index="starred">
            <el-icon>
              <StarFilled/>
            </el-icon>
            <span>收藏</span>
          </el-menu-item>
          <el-menu-item index="shared">
            <el-icon>
              <Share/>
            </el-icon>
            <span>分享</span>
          </el-menu-item>
          <el-menu-item index="images">
            <el-icon>
              <Picture/>
            </el-icon>
            <span>图片</span>
          </el-menu-item>
          <el-menu-item index="documents">
            <el-icon>
              <Document/>
            </el-icon>
            <span>文档</span>
          </el-menu-item>
          <el-menu-item index="videos">
            <el-icon>
              <VideoPlay/>
            </el-icon>
            <span>视频</span>
          </el-menu-item>
          <el-menu-item index="audio">
            <el-icon>
              <Headset/>
            </el-icon>
            <span>音频</span>
          </el-menu-item>
          <el-menu-item index="recent">
            <el-icon>
              <Timer/>
            </el-icon>
            <span>最近访问</span>
          </el-menu-item>
          <el-menu-item index="trash">
            <el-icon>
              <Delete/>
            </el-icon>
            <span>回收站</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 主内容区 -->
      <div class="cloud-drive-content">
        <!-- 工具栏 -->
        <div class="content-toolbar">
          <div class="left-actions">
            <el-button type="primary" @click="handleUpload">
              <el-icon>
                <Upload/>
              </el-icon>
              上传文件
            </el-button>
            <el-button @click="createFolder">
              <el-icon>
                <FolderAdd/>
              </el-icon>
              新建文件夹
            </el-button>
            <el-button-group v-show="selectedFiles.length > 0" class="selection-actions">
              <el-button :disabled="selectedFiles.length === 0" @click="batchDownload">
                <el-icon>
                  <Download/>
                </el-icon>
                下载
              </el-button>
              <el-button :disabled="selectedFiles.length === 0" @click="batchMove">
                <el-icon>
                  <Right/>
                </el-icon>
                移动
              </el-button>
              <el-button :disabled="selectedFiles.length === 0" type="danger" @click="batchDelete">
                <el-icon>
                  <Delete/>
                </el-icon>
                删除
              </el-button>
            </el-button-group>
          </div>

          <div class="right-actions">
            <div class="search-box">
              <el-input v-model="searchQuery" clearable placeholder="搜索文件...">
                <template #prefix>
                  <el-icon>
                    <Search/>
                  </el-icon>
                </template>
              </el-input>
              <div class="view-mode-toggle">
                <el-tooltip :show-after="500" content="网格视图" placement="top">
                  <div
                    :class="{ active: viewMode === 'grid' }"
                    class="view-mode-btn"
                    @click="viewMode = 'grid'"
                  >
                    <el-icon>
                      <Grid/>
                    </el-icon>
                  </div>
                </el-tooltip>
                <el-tooltip :show-after="500" content="列表视图" placement="top">
                  <div
                    :class="{ active: viewMode === 'list' }"
                    class="view-mode-btn"
                    @click="viewMode = 'list'"
                  >
                    <el-icon>
                      <List/>
                    </el-icon>
                  </div>
                </el-tooltip>
              </div>
            </div>
            <el-select v-model="currentSort" placeholder="排序方式" size="default">
              <el-option label="名称 (A-Z)" value="nameAsc"/>
              <el-option label="名称 (Z-A)" value="nameDesc"/>
              <el-option label="最新修改" value="dateDesc"/>
              <el-option label="最早修改" value="dateAsc"/>
              <el-option label="大小 (大-小)" value="sizeDesc"/>
              <el-option label="大小 (小-大)" value="sizeAsc"/>
            </el-select>
          </div>
        </div>

        <!-- 面包屑导航 -->
        <div class="breadcrumb-nav">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">全部文件</el-breadcrumb-item>
            <el-breadcrumb-item
              v-for="(folder, index) in currentPath"
              :key="index"
              :to="{ path: getFolderPath(index) }">
              {{ folder.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <!-- 最近访问区域 -->
        <div v-if="activeMenu === 'recent'" class="recent-files-section">
          <h3 class="section-title">最近访问</h3>
          <el-empty v-if="recentFiles.length === 0" description="暂无最近访问的文件"/>
          <div v-else class="file-grid">
            <div
              v-for="file in recentFiles"
              :key="file.id"
              class="file-card"
              @click="openFile(file)">
              <div class="file-icon">
                <el-icon v-if="file.type === 'folder'">
                  <Folder/>
                </el-icon>
                <el-image v-else-if="isImage(file.type)" :src="file.url" fit="cover"/>
                <el-icon v-else-if="isDocument(file.type)">
                  <Document/>
                </el-icon>
                <el-icon v-else-if="isVideo(file.type)">
                  <VideoPlay/>
                </el-icon>
                <el-icon v-else-if="isAudio(file.type)">
                  <Headset/>
                </el-icon>
                <el-icon v-else>
                  <Document/>
                </el-icon>
              </div>
              <div class="file-info">
                <div :title="file.name" class="file-name">{{ file.name }}</div>
                <div class="file-meta">{{ formatDate(file.accessedAt || file.updatedAt) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 文件列表（网格视图） -->
        <div v-if="viewMode === 'grid' && activeMenu !== 'recent'" class="file-grid-view">
          <el-empty v-if="filteredFiles.length === 0" description="暂无文件"/>
          <div v-else class="file-grid">
            <div
              v-for="file in filteredFiles"
              :key="file.id"
              :class="{ 'is-selected': selectedFiles.includes(file.id) }"
              class="file-card"
              @click="selectFile(file)"
              @dblclick="openFile">
              <div class="file-checkbox">
                <el-checkbox
                  :modelValue="selectedFiles.includes(file.id)"
                  @click.stop="toggleSelection(file)"
                />
              </div>
              <div class="file-action-buttons">
                <el-button
                  :class="{ 'starred': file.starred }"
                  size="small"
                  type="text"
                  @click.stop="toggleStarred(file)">
                  <el-icon v-if="file.starred">
                    <StarFilled/>
                  </el-icon>
                  <el-icon v-else>
                    <Star/>
                  </el-icon>
                </el-button>
                <el-button
                  v-if="file.shared"
                  class="shared"
                  size="small"
                  type="text"
                  @click.stop="openShareSettings(file)">
                  <el-icon>
                    <Share/>
                  </el-icon>
                </el-button>
              </div>
              <div class="file-icon">
                <el-icon v-if="file.type === 'folder'">
                  <Folder/>
                </el-icon>
                <el-image v-else-if="isImage(file.type)" :src="file.url" fit="cover"/>
                <el-icon v-else-if="isDocument(file.type)">
                  <Document/>
                </el-icon>
                <el-icon v-else-if="isVideo(file.type)">
                  <VideoPlay/>
                </el-icon>
                <el-icon v-else-if="isAudio(file.type)">
                  <Headset/>
                </el-icon>
                <el-icon v-else>
                  <Document/>
                </el-icon>
              </div>
              <div class="file-info">
                <div :title="file.name" class="file-name">{{ file.name }}</div>
                <div class="file-meta">
                  <span>{{ file.type === 'folder' ? '文件夹' : formatSize(file.size) }}</span>
                  <span>{{ formatDate(file.updatedAt) }}</span>
                  <div v-if="file.tags && file.tags.length" class="file-tags">
                    <el-tag v-for="tag in file.tags" :key="tag" class="file-tag" size="small">{{
                        tag
                      }}
                    </el-tag>
                  </div>
                </div>
              </div>
              <div class="file-actions">
                <el-dropdown trigger="click" @command="handleCommand($event, file)">
                  <el-button size="small" type="text">
                    <el-icon>
                      <More/>
                    </el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-if="file.type !== 'folder' && canPreview(file.type)"
                                        command="preview">预览
                      </el-dropdown-item>
                      <el-dropdown-item v-if="file.type !== 'folder'" command="download">下载
                      </el-dropdown-item>
                      <el-dropdown-item command="star">{{
                          file.starred ? '取消收藏' : '收藏'
                        }}
                      </el-dropdown-item>
                      <el-dropdown-item command="share">{{
                          file.shared ? '分享设置' : '分享'
                        }}
                      </el-dropdown-item>
                      <el-dropdown-item v-if="file.type !== 'folder'" command="version">版本管理
                      </el-dropdown-item>
                      <el-dropdown-item command="permission">权限管理</el-dropdown-item>
                      <el-dropdown-item command="info">详细信息</el-dropdown-item>
                      <el-dropdown-item command="rename">重命名</el-dropdown-item>
                      <el-dropdown-item command="move">移动</el-dropdown-item>
                      <el-dropdown-item command="copy">复制</el-dropdown-item>
                      <el-dropdown-item command="delete" divided type="danger">删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>

        <!-- 文件列表（列表视图） -->
        <div v-else-if="viewMode === 'list' && activeMenu !== 'recent'" class="file-list-view">
          <el-table
            :data="filteredFiles"
            :row-class-name="getRowClass"
            style="width: 100%"
            @row-click="selectFile"
            @row-dblclick="openFile">
            <el-table-column type="selection" width="55"/>
            <el-table-column label="名称" min-width="300">
              <template #default="scope">
                <div class="file-name-cell">
                  <el-icon v-if="scope.row.type === 'folder'">
                    <Folder/>
                  </el-icon>
                  <el-icon v-else-if="isImage(scope.row.type)">
                    <Picture/>
                  </el-icon>
                  <el-icon v-else-if="isDocument(scope.row.type)">
                    <Document/>
                  </el-icon>
                  <el-icon v-else-if="isVideo(scope.row.type)">
                    <VideoPlay/>
                  </el-icon>
                  <el-icon v-else-if="isAudio(scope.row.type)">
                    <Headset/>
                  </el-icon>
                  <el-icon v-else>
                    <Document/>
                  </el-icon>
                  <span>{{ scope.row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="大小" width="120">
              <template #default="scope">
                {{ scope.row.type === 'folder' ? '-' : formatSize(scope.row.size) }}
              </template>
            </el-table-column>
            <el-table-column label="修改日期" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.updatedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="280">
              <template #default="scope">
                <div class="table-actions">
                  <el-button
                    :class="{ 'starred': scope.row.starred }"
                    type="text"
                    @click.stop="toggleStarred(scope.row)">
                    <el-icon v-if="scope.row.starred">
                      <StarFilled/>
                    </el-icon>
                    <el-icon v-else>
                      <Star/>
                    </el-icon>
                  </el-button>
                  <el-button
                    v-if="scope.row.shared"
                    class="shared"
                    type="text"
                    @click.stop="openShareSettings(scope.row)">
                    <el-icon>
                      <Share/>
                    </el-icon>
                  </el-button>
                  <el-button
                    v-if="scope.row.type !== 'folder' && canPreview(scope.row.type)"
                    size="small"
                    @click.stop="openPreview(scope.row)">
                    预览
                  </el-button>
                  <el-button
                    v-if="scope.row.type !== 'folder'"
                    size="small"
                    @click.stop="downloadFile(scope.row)">
                    下载
                  </el-button>
                  <el-dropdown trigger="click" @command="handleCommand($event, scope.row)">
                    <el-button size="small">
                      更多
                      <el-icon class="el-icon--right">
                        <ArrowDown/>
                      </el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="star">{{
                            scope.row.starred ? '取消收藏' : '收藏'
                          }}
                        </el-dropdown-item>
                        <el-dropdown-item command="share">{{
                            scope.row.shared ? '分享设置' : '分享'
                          }}
                        </el-dropdown-item>
                        <el-dropdown-item v-if="scope.row.type !== 'folder'" command="version">版本管理
                        </el-dropdown-item>
                        <el-dropdown-item command="permission">权限管理</el-dropdown-item>
                        <el-dropdown-item command="info">详细信息</el-dropdown-item>
                        <el-dropdown-item command="rename">重命名</el-dropdown-item>
                        <el-dropdown-item command="move">移动</el-dropdown-item>
                        <el-dropdown-item command="copy">复制</el-dropdown-item>
                        <el-dropdown-item command="delete" divided type="danger">删除
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 上传文件对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传文件" width="550px">
      <div class="upload-dialog">
        <el-upload
          :before-remove="beforeRemove"
          :file-list="fileList"
          :on-error="uploadError"
          :on-preview="handlePreview"
          :on-progress="uploadProgress"
          :on-remove="handleRemove"
          :on-success="uploadSuccess"
          action="https://api.example.com/upload"
          class="upload-area"
          drag
          multiple>
          <div class="upload-content">
            <el-icon class="upload-icon">
              <upload-filled/>
            </el-icon>
            <div class="upload-text">将文件拖到此处，或<em>点击上传</em></div>
            <div class="upload-hint">支持各种文件类型，单个文件不超过100MB</div>
          </div>
        </el-upload>
        <div v-if="uploadPercentage > 0" class="upload-progress">
          <div class="progress-info">
            <span>上传进度</span>
            <span>{{ uploadPercentage }}%</span>
          </div>
          <el-progress :percentage="uploadPercentage"/>
        </div>
      </div>
    </el-dialog>

    <!-- 创建文件夹对话框 -->
    <el-dialog v-model="folderDialogVisible" title="新建文件夹" width="400px">
      <div class="folder-dialog">
        <el-input
          v-model="folderForm.name"
          autofocus
          clearable
          placeholder="请输入文件夹名称"
          prefix-icon="Folder">
        </el-input>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="folderDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreateFolder">创建</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 重命名对话框 -->
    <el-dialog v-model="renameDialogVisible" title="重命名" width="400px">
      <el-input
        v-model="renameForm.name"
        autofocus
        clearable
        placeholder="请输入新名称">
      </el-input>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="renameDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRename">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 移动文件对话框 -->
    <el-dialog v-model="moveDialogVisible" title="移动到" width="450px">
      <div class="folder-tree">
        <el-tree
          :data="folderTree"
          :props="{ label: 'name', children: 'children' }"
          default-expand-all
          highlight-current
          @node-click="handleNodeClick">
        </el-tree>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="moveDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitMove">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 文件预览对话框 -->
    <el-dialog v-model="previewDialogVisible" :title="previewFile.name" class="preview-dialog"
               top="5vh" width="85%">
      <div class="preview-header">
        <div class="preview-file-info">
          <el-icon v-if="previewFile.type === 'folder'" class="preview-icon">
            <Folder/>
          </el-icon>
          <el-icon v-else-if="isDocument(previewFile.type)" class="preview-icon">
            <Document/>
          </el-icon>
          <el-icon v-else-if="isVideo(previewFile.type)" class="preview-icon">
            <VideoPlay/>
          </el-icon>
          <el-icon v-else-if="isAudio(previewFile.type)" class="preview-icon">
            <Headset/>
          </el-icon>
          <el-icon v-else class="preview-icon">
            <Document/>
          </el-icon>
          <div>
            <h3>{{ previewFile.name }}</h3>
            <span class="preview-meta">{{ formatSize(previewFile.size) }} · {{
                formatDate(previewFile.updatedAt)
              }}</span>
          </div>
        </div>
        <div class="preview-actions">
          <el-tooltip content="下载" placement="top">
            <el-button v-if="previewFile.type !== 'folder'" circle
                       @click="downloadFile(previewFile)">
              <el-icon>
                <Download/>
              </el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="收藏" placement="top">
            <el-button :class="{ 'starred-btn': previewFile.starred }" circle
                       @click="toggleStarred(previewFile)">
              <el-icon v-if="previewFile.starred">
                <StarFilled/>
              </el-icon>
              <el-icon v-else>
                <Star/>
              </el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="分享" placement="top">
            <el-button circle @click="openShareSettings(previewFile)">
              <el-icon>
                <Share/>
              </el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="关闭" placement="top">
            <el-button circle @click="previewDialogVisible = false">
              <el-icon>
                <Close/>
              </el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
      <div class="preview-container">
        <!-- 图片预览 -->
        <div v-if="isImage(previewFile.type)" class="image-preview-wrapper">
          <img
            :alt="previewFile.name"
            :src="previewFile.url"
            class="preview-image"/>
          <div class="preview-zoom-controls">
            <el-button-group>
              <el-button :disabled="previewZoom <= 0.5" @click="zoomOut">
                <el-icon>
                  <ZoomOut/>
                </el-icon>
              </el-button>
              <el-button>{{ Math.round(previewZoom * 100) }}%</el-button>
              <el-button :disabled="previewZoom >= 2" @click="zoomIn">
                <el-icon>
                  <ZoomIn/>
                </el-icon>
              </el-button>
            </el-button-group>
            <el-button @click="resetZoom">
              <el-icon>
                <Full/>
              </el-icon>
              适应屏幕
            </el-button>
          </div>
        </div>

        <!-- 视频预览 -->
        <div v-else-if="isVideo(previewFile.type)" class="video-preview-wrapper">
          <video
            :src="previewFile.url"
            class="preview-video"
            controls></video>
        </div>

        <!-- 音频预览 -->
        <div v-else-if="isAudio(previewFile.type)" class="audio-preview-wrapper">
          <div class="audio-player">
            <div class="audio-cover">
              <el-icon>
                <Headset/>
              </el-icon>
            </div>
            <div class="audio-info">
              <h4>{{ previewFile.name }}</h4>
              <audio
                :src="previewFile.url"
                class="preview-audio"
                controls></audio>
            </div>
          </div>
        </div>

        <!-- 文档预览 (使用iframe嵌入文档查看器) -->
        <iframe
          v-else-if="isDocument(previewFile.type)"
          :src="`https://docs.google.com/viewer?url=${encodeURIComponent(previewFile.url)}&embedded=true`"
          class="preview-document"></iframe>

        <!-- 其他文件类型 -->
        <div v-else class="preview-unsupported">
          <el-icon>
            <DocumentDelete/>
          </el-icon>
          <p>无法预览此类型的文件</p>
          <el-button type="primary" @click="downloadFile(previewFile)">下载查看</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 文件详情对话框 -->
    <el-dialog v-model="fileInfoDialogVisible" :title="fileDetail.name" class="file-info-dialog"
               width="600px">
      <div class="file-detail-content">
        <div class="file-detail-header">
          <div class="file-detail-icon">
            <el-icon v-if="fileDetail.type === 'folder'">
              <Folder/>
            </el-icon>
            <el-image v-else-if="isImage(fileDetail.type)" :src="fileDetail.url" fit="cover"/>
            <el-icon v-else-if="isDocument(fileDetail.type)">
              <Document/>
            </el-icon>
            <el-icon v-else-if="isVideo(fileDetail.type)">
              <VideoPlay/>
            </el-icon>
            <el-icon v-else-if="isAudio(fileDetail.type)">
              <Headset/>
            </el-icon>
            <el-icon v-else>
              <Document/>
            </el-icon>
          </div>
          <div class="file-detail-info">
            <h3>{{ fileDetail.name }}</h3>
            <p>{{ getFileTypeName(fileDetail.type) }}</p>
          </div>
        </div>

        <el-divider/>

        <div class="file-tabs">
          <el-tabs v-model="activeDetailTab">
            <el-tab-pane label="基本信息" name="basic">
              <div class="file-detail-meta">
                <div class="meta-item">
                  <div class="meta-label">
                    <el-icon>
                      <Document/>
                    </el-icon>
                    <span>大小</span>
                  </div>
                  <div class="meta-value">
                    {{ fileDetail.type === 'folder' ? '-' : formatSize(fileDetail.size) }}
                  </div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">
                    <el-icon>
                      <Calendar/>
                    </el-icon>
                    <span>创建时间</span>
                  </div>
                  <div class="meta-value">{{ formatDate(fileDetail.createdAt) }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">
                    <el-icon>
                      <Timer/>
                    </el-icon>
                    <span>修改时间</span>
                  </div>
                  <div class="meta-value">{{ formatDate(fileDetail.updatedAt) }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">
                    <el-icon>
                      <Folder/>
                    </el-icon>
                    <span>位置</span>
                  </div>
                  <div class="meta-value">{{ fileDetail.parentId ? '子文件夹' : '根目录' }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">
                    <el-icon>
                      <InfoFilled/>
                    </el-icon>
                    <span>版本</span>
                  </div>
                  <div class="meta-value meta-with-action">
                    <span>v{{ fileDetail.version }}</span>
                    <el-button v-if="fileDetail.type !== 'folder'" link type="primary"
                               @click="openVersionDialog(fileDetail)">
                      查看历史版本
                    </el-button>
                  </div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">
                    <el-icon>
                      <Lock/>
                    </el-icon>
                    <span>权限</span>
                  </div>
                  <div class="meta-value meta-with-action">
                    <span>{{ getPermissionText(fileDetail) }}</span>
                    <el-button link type="primary" @click="openPermissionDialog(fileDetail)">
                      管理权限
                    </el-button>
                  </div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">
                    <el-icon>
                      <Warning/>
                    </el-icon>
                    <span>状态</span>
                  </div>
                  <div class="meta-value">
                    <div class="status-tags">
                      <el-tag v-if="fileDetail.starred" class="status-tag" type="success">
                        <el-icon>
                          <StarFilled/>
                        </el-icon>
                        已收藏
                      </el-tag>
                      <el-tag v-if="fileDetail.shared" class="status-tag" type="info">
                        <el-icon>
                          <Share/>
                        </el-icon>
                        已分享
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="标签" name="tags">
              <div class="file-detail-tags">
                <div class="tags-container">
                  <el-tag
                    v-for="tag in fileDetail.tags"
                    :key="tag"
                    class="file-detail-tag"
                    closable
                    @close="removeTag(tag)">
                    {{ tag }}
                  </el-tag>
                  <el-input
                    v-if="inputTagVisible"
                    ref="tagInputRef"
                    v-model="newTag"
                    class="tag-input"
                    size="small"
                    @blur="confirmTag"
                    @keyup.enter="confirmTag"
                  />
                  <el-button v-else class="new-tag-btn" size="small" @click="showTagInput">
                    <el-icon>
                      <Plus/>
                    </el-icon>
                    新标签
                  </el-button>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane v-if="fileDetail.shared" label="分享" name="share">
              <div class="file-share-info">
                <div class="share-link-section">
                  <h4>分享链接</h4>
                  <div class="share-link-container">
                    <el-input v-model="fileDetail.shareLink" readonly>
                      <template #append>
                        <el-button @click="copyShareLink">复制</el-button>
                      </template>
                    </el-input>
                    <div class="share-qrcode">
                      <img alt="分享二维码"
                           src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Example"/>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="fileInfoDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleFileTags">保存更改</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分享设置对话框 -->
    <el-dialog v-model="shareDialogVisible" title="分享文件" width="500px">
      <div class="share-dialog-content">
        <div class="share-file-info">
          <div class="share-file-icon">
            <el-icon v-if="shareFile.type === 'folder'">
              <Folder/>
            </el-icon>
            <el-image v-else-if="isImage(shareFile.type)" :src="shareFile.url" fit="cover"/>
            <el-icon v-else-if="isDocument(shareFile.type)">
              <Document/>
            </el-icon>
            <el-icon v-else-if="isVideo(shareFile.type)">
              <VideoPlay/>
            </el-icon>
            <el-icon v-else-if="isAudio(shareFile.type)">
              <Headset/>
            </el-icon>
            <el-icon v-else>
              <Document/>
            </el-icon>
          </div>
          <div class="share-file-detail">
            <h3>{{ shareFile.name }}</h3>
            <p>{{ getFileTypeName(shareFile.type) }}</p>
          </div>
        </div>

        <el-divider/>

        <div class="share-toggle">
          <span>启用分享</span>
          <el-switch v-model="shareFile.shared"/>
        </div>

        <template v-if="shareFile.shared">
          <div class="share-link-section">
            <span class="section-label">分享链接</span>
            <div class="share-link-container">
              <el-input v-model="shareFile.shareLink" readonly>
                <template #append>
                  <el-button @click="copyShareLink">复制</el-button>
                </template>
              </el-input>
            </div>
            <el-button class="new-link-btn" size="small" type="primary" @click="generateNewLink">
              生成新链接
            </el-button>
          </div>

          <div class="share-options">
            <span class="section-label">分享选项</span>
            <el-form :model="shareOptions" label-position="top">
              <el-form-item label="访问限制">
                <el-radio-group v-model="shareOptions.access">
                  <el-radio label="anyone">任何人可访问</el-radio>
                  <el-radio label="password">需要密码</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item v-if="shareOptions.access === 'password'" label="密码">
                <el-input v-model="shareOptions.password" placeholder="设置密码" show-password/>
              </el-form-item>

              <el-form-item label="有效期">
                <el-select v-model="shareOptions.expiry" placeholder="选择有效期">
                  <el-option label="永久有效" value="never"/>
                  <el-option label="1天" value="1d"/>
                  <el-option label="7天" value="7d"/>
                  <el-option label="30天" value="30d"/>
                  <el-option label="自定义" value="custom"/>
                </el-select>

                <el-date-picker
                  v-if="shareOptions.expiry === 'custom'"
                  v-model="shareOptions.expiryDate"
                  format="YYYY-MM-DD HH:mm"
                  placeholder="选择日期和时间"
                  style="margin-top: 10px; width: 100%;"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm"
                />
              </el-form-item>

              <el-form-item label="权限">
                <el-checkbox v-model="shareOptions.canDownload">允许下载</el-checkbox>
                <el-checkbox v-model="shareOptions.canCopy" style="margin-left: 20px;">允许复制
                </el-checkbox>
              </el-form-item>
            </el-form>
          </div>
        </template>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="shareDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveShareSettings">保存设置</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 设置对话框 -->
    <el-dialog v-model="settingsDialogVisible" title="设置" width="500px">
      <div class="settings-content">
        <el-tabs v-model="settingsActiveTab">
          <el-tab-pane label="常规设置" name="general">
            <div class="settings-section">
              <h4>显示设置</h4>
              <el-form label-position="left" label-width="100px">
                <el-form-item label="默认视图">
                  <el-radio-group v-model="settings.defaultView">
                    <el-radio label="grid">网格视图</el-radio>
                    <el-radio label="list">列表视图</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="暗色模式">
                  <el-switch v-model="settings.darkMode" @change="applyDarkMode"/>
                </el-form-item>
                <el-form-item label="每页显示">
                  <el-select v-model="settings.itemsPerPage">
                    <el-option :value="20" label="20"/>
                    <el-option :value="50" label="50"/>
                    <el-option :value="100" label="100"/>
                  </el-select>
                </el-form-item>
              </el-form>
            </div>

            <el-divider/>

            <div class="settings-section">
              <h4>排序与文件操作</h4>
              <el-form label-position="left" label-width="140px">
                <el-form-item label="默认排序方式">
                  <el-select v-model="settings.defaultSort">
                    <el-option label="名称 (A-Z)" value="nameAsc"/>
                    <el-option label="名称 (Z-A)" value="nameDesc"/>
                    <el-option label="最新修改" value="dateDesc"/>
                    <el-option label="最早修改" value="dateAsc"/>
                    <el-option label="大小 (大-小)" value="sizeDesc"/>
                    <el-option label="大小 (小-大)" value="sizeAsc"/>
                  </el-select>
                </el-form-item>
                <el-form-item label="删除文件设置">
                  <el-checkbox v-model="settings.moveToTrashFirst">删除前移至回收站</el-checkbox>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>

          <el-tab-pane label="存储" name="storage">
            <div class="storage-section">
              <h4>存储空间</h4>
              <div class="storage-detail">
                <el-progress :percentage="storageInfo.percentage" :stroke-width="12"/>
                <div class="storage-labels">
                  <span>已使用：{{ formatSize(storageInfo.used) }}</span>
                  <span>总容量：{{ formatSize(storageInfo.total) }}</span>
                </div>
                <div class="storage-breakdown">
                  <h5>存储分布</h5>
                  <div class="storage-type">
                    <span>图片</span>
                    <el-progress :percentage="25" :show-text="false"/>
                    <span>{{ formatSize(0.25 * storageInfo.used) }}</span>
                  </div>
                  <div class="storage-type">
                    <span>文档</span>
                    <el-progress :percentage="15" :show-text="false"/>
                    <span>{{ formatSize(0.15 * storageInfo.used) }}</span>
                  </div>
                  <div class="storage-type">
                    <span>视频</span>
                    <el-progress :percentage="40" :show-text="false"/>
                    <span>{{ formatSize(0.4 * storageInfo.used) }}</span>
                  </div>
                  <div class="storage-type">
                    <span>音频</span>
                    <el-progress :percentage="10" :show-text="false"/>
                    <span>{{ formatSize(0.1 * storageInfo.used) }}</span>
                  </div>
                  <div class="storage-type">
                    <span>其他</span>
                    <el-progress :percentage="10" :show-text="false"/>
                    <span>{{ formatSize(0.1 * storageInfo.used) }}</span>
                  </div>
                </div>
              </div>
              <div class="storage-actions">
                <el-button type="primary">升级存储空间</el-button>
                <el-button>管理存储</el-button>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="分享设置" name="sharing">
            <div class="sharing-section">
              <h4>默认分享设置</h4>
              <el-form label-position="left" label-width="140px">
                <el-form-item label="默认权限">
                  <el-radio-group v-model="settings.defaultShareAccess">
                    <el-radio label="anyone">任何人可访问</el-radio>
                    <el-radio label="password">需要密码</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="默认有效期">
                  <el-select v-model="settings.defaultShareExpiry">
                    <el-option label="永久有效" value="never"/>
                    <el-option label="1天" value="1d"/>
                    <el-option label="7天" value="7d"/>
                    <el-option label="30天" value="30d"/>
                  </el-select>
                </el-form-item>
                <el-form-item label="默认权限">
                  <el-checkbox v-model="settings.defaultCanDownload">允许下载</el-checkbox>
                  <el-checkbox v-model="settings.defaultCanCopy" style="margin-left: 20px;">
                    允许复制
                  </el-checkbox>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="settingsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 版本管理对话框 -->
    <el-dialog v-model="versionDialogVisible" title="版本管理" width="600px">
      <div class="version-dialog-content">
        <div class="version-file-info">
          <div class="version-file-icon">
            <el-icon v-if="versionFile.type === 'folder'">
              <Folder/>
            </el-icon>
            <el-image v-else-if="isImage(versionFile.type)" :src="versionFile.url" fit="cover"/>
            <el-icon v-else-if="isDocument(versionFile.type)">
              <Document/>
            </el-icon>
            <el-icon v-else-if="isVideo(versionFile.type)">
              <VideoPlay/>
            </el-icon>
            <el-icon v-else-if="isAudio(versionFile.type)">
              <Headset/>
            </el-icon>
            <el-icon v-else>
              <Document/>
            </el-icon>
          </div>
          <div class="version-file-detail">
            <h3>{{ versionFile.name }}</h3>
            <p>{{ getFileTypeName(versionFile.type) }}</p>
          </div>
        </div>

        <el-divider/>

        <div class="version-list-header">
          <h4>版本历史</h4>
          <el-button size="small" type="primary" @click="uploadNewVersion">
            <el-icon>
              <Upload/>
            </el-icon>
            上传新版本
          </el-button>
        </div>

        <div class="version-list">
          <el-timeline>
            <el-timeline-item
              v-for="(version, index) in fileVersions"
              :key="index"
              :hollow="!version.current"
              :icon="version.current ? 'CircleCheck' : ''"
              :timestamp="version.date"
              :type="version.current ? 'primary' : ''"
            >
              <div class="version-item">
                <div class="version-info">
                  <span class="version-number">v{{ version.number }}</span>
                  <span class="version-size">{{ formatSize(version.size) }}</span>
                  <el-tag v-if="version.current" size="small" type="success">当前版本</el-tag>
                </div>
                <div class="version-desc">{{ version.description }}</div>
                <div class="version-actions">
                  <el-button size="small" @click="previewVersion(version)">预览</el-button>
                  <el-button :disabled="version.current" size="small"
                             @click="restoreVersion(version)">恢复此版本
                  </el-button>
                  <el-button :disabled="version.current" size="small" type="danger"
                             @click="deleteVersion(version)">
                    删除
                  </el-button>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>

    <!-- 上传新版本对话框 -->
    <el-dialog v-model="uploadVersionDialogVisible" title="上传新版本" width="500px">
      <div class="upload-version-dialog">
        <el-upload
          :file-list="versionFileList"
          :multiple="false"
          :on-error="uploadVersionError"
          :on-progress="uploadVersionProgress"
          :on-success="uploadVersionSuccess"
          action="https://api.example.com/upload/version"
          class="upload-area"
          drag>
          <div class="upload-content">
            <el-icon class="upload-icon">
              <upload-filled/>
            </el-icon>
            <div class="upload-text">将新版本文件拖到此处，或<em>点击上传</em></div>
          </div>
        </el-upload>

        <div v-if="versionFileList.length > 0" class="version-form">
          <el-form :model="versionForm" label-position="top">
            <el-form-item label="版本描述">
              <el-input
                v-model="versionForm.description"
                :rows="3"
                placeholder="请描述此版本的更改内容..."
                type="textarea"
              />
            </el-form-item>
            <el-form-item label="是否设为当前版本">
              <el-switch v-model="versionForm.setAsCurrent"/>
            </el-form-item>
          </el-form>
        </div>

        <div v-if="versionUploadPercentage > 0" class="upload-progress">
          <div class="progress-info">
            <span>上传进度</span>
            <span>{{ versionUploadPercentage }}%</span>
          </div>
          <el-progress :percentage="versionUploadPercentage"/>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadVersionDialogVisible = false">取消</el-button>
          <el-button :disabled="versionFileList.length === 0" type="primary"
                     @click="confirmUploadVersion">确认上传</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 文件权限管理对话框 -->
    <el-dialog v-model="permissionDialogVisible" title="权限管理" width="600px">
      <div class="permission-dialog-content">
        <div class="permission-file-info">
          <div class="permission-file-icon">
            <el-icon v-if="permissionFile.type === 'folder'">
              <Folder/>
            </el-icon>
            <el-image v-else-if="isImage(permissionFile.type)" :src="permissionFile.url"
                      fit="cover"/>
            <el-icon v-else-if="isDocument(permissionFile.type)">
              <Document/>
            </el-icon>
            <el-icon v-else-if="isVideo(permissionFile.type)">
              <VideoPlay/>
            </el-icon>
            <el-icon v-else-if="isAudio(permissionFile.type)">
              <Headset/>
            </el-icon>
            <el-icon v-else>
              <Document/>
            </el-icon>
          </div>
          <div class="permission-file-detail">
            <h3>{{ permissionFile.name }}</h3>
            <p>{{ getFileTypeName(permissionFile.type) }}</p>
          </div>
        </div>

        <el-divider/>

        <div class="permission-section">
          <h4>访问控制</h4>
          <el-radio-group v-model="permissionSettings.accessLevel" class="permission-access-group">
            <el-radio label="private">
              <div class="radio-content">
                <el-icon>
                  <Lock/>
                </el-icon>
                <div class="radio-text">
                  <div>仅我可访问</div>
                  <div class="radio-desc">只有您可以访问此文件</div>
                </div>
              </div>
            </el-radio>
            <el-radio label="specific">
              <div class="radio-content">
                <el-icon>
                  <User/>
                </el-icon>
                <div class="radio-text">
                  <div>特定用户</div>
                  <div class="radio-desc">仅允许您指定的用户访问</div>
                </div>
              </div>
            </el-radio>
            <el-radio label="public">
              <div class="radio-content">
                <el-icon>
                  <Share/>
                </el-icon>
                <div class="radio-text">
                  <div>公开分享</div>
                  <div class="radio-desc">任何拥有链接的人都可以访问</div>
                </div>
              </div>
            </el-radio>
          </el-radio-group>
        </div>

        <div v-if="permissionSettings.accessLevel === 'specific'" class="permission-users-section">
          <div class="user-list-header">
            <h4>已授权用户</h4>
            <el-button size="small" type="primary" @click="showAddUserForm = true">
              <el-icon>
                <Plus/>
              </el-icon>
              添加用户
            </el-button>
          </div>

          <div v-if="showAddUserForm" class="add-user-form">
            <el-form :model="newUserPermission" inline>
              <el-form-item>
                <el-input v-model="newUserPermission.email" placeholder="用户邮箱"/>
              </el-form-item>
              <el-form-item>
                <el-select v-model="newUserPermission.role" placeholder="选择权限">
                  <el-option label="查看者" value="viewer"/>
                  <el-option label="编辑者" value="editor"/>
                  <el-option label="所有者" value="owner"/>
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="addUserPermission">添加</el-button>
                <el-button @click="showAddUserForm = false">取消</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table :data="permissionSettings.users" style="width: 100%">
            <el-table-column label="用户" prop="email"/>
            <el-table-column label="权限" prop="role">
              <template #default="scope">
                <el-tag v-if="scope.row.role === 'viewer'" type="info">查看者</el-tag>
                <el-tag v-else-if="scope.row.role === 'editor'" type="warning">编辑者</el-tag>
                <el-tag v-else-if="scope.row.role === 'owner'" type="success">所有者</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button type="text" @click="editUserPermission(scope.row)">编辑</el-button>
                <el-button class="delete-btn" type="text" @click="removeUserPermission(scope.row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="permissionSettings.accessLevel === 'public'" class="public-link-section">
          <h4>公开链接</h4>
          <div class="link-container">
            <el-input v-model="permissionSettings.publicLink" readonly>
              <template #append>
                <el-button @click="copyPublicLink">复制</el-button>
              </template>
            </el-input>
          </div>
          <div class="public-options">
            <el-form :model="permissionSettings" label-position="top">
              <el-form-item label="链接有效期">
                <el-select v-model="permissionSettings.linkExpiry" placeholder="选择有效期">
                  <el-option label="永久有效" value="never"/>
                  <el-option label="1天" value="1d"/>
                  <el-option label="7天" value="7d"/>
                  <el-option label="30天" value="30d"/>
                </el-select>
              </el-form-item>
              <el-form-item label="访问权限">
                <el-checkbox v-model="permissionSettings.allowDownload">允许下载</el-checkbox>
                <el-checkbox v-model="permissionSettings.allowCopy" style="margin-left: 20px;">
                  允许复制
                </el-checkbox>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePermissionSettings">保存设置</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, nextTick} from 'vue';
import {
  Upload, FolderAdd, Search, Grid, List, Folder, Picture, Document,
  VideoPlay, Headset, More, UploadFilled, DocumentDelete, Download,
  Delete, Timer, Right, ArrowDown, Close, Share, Star, StarFilled, Setting,
  Moon, Sunny, InfoFilled, Calendar, Link, Paperclip, CircleCheck, Warning,
  Lock, User, Plus, ZoomOut, ZoomIn, Refresh, Unlock, Message
} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox} from 'element-plus';

// 存储信息
const storageInfo = ref({
  used: 1.8 * 1024 * 1024 * 1024, // 1.8GB
  total: 10 * 1024 * 1024 * 1024,  // 10GB
  percentage: 18
});

// 视图模式
const viewMode = ref('grid');
const searchQuery = ref('');

// 排序选项
const currentSort = ref('dateDesc');

// 左侧菜单
const activeMenu = ref('all');

// 当前路径
const currentPath = ref([]);

// 文件数据
const files = ref([
  {
    id: '1',
    name: '我的文档',
    type: 'folder',
    size: 0,
    createdAt: '2023-05-08T09:30:45Z',
    updatedAt: '2023-05-10T10:30:45Z',
    parentId: null,
    starred: false,
    tags: ['工作'],
    shared: false,
    shareLink: '',
    version: 1
  },
  {
    id: '2',
    name: '项目资料',
    type: 'folder',
    size: 0,
    createdAt: '2023-05-10T11:20:30Z',
    updatedAt: '2023-05-12T15:20:30Z',
    parentId: null,
    starred: true,
    tags: ['项目', '重要'],
    shared: false,
    shareLink: '',
    version: 1
  },
  {
    id: '3',
    name: '旅行照片',
    type: 'folder',
    size: 0,
    createdAt: '2023-06-01T08:45:12Z',
    updatedAt: '2023-06-05T08:45:12Z',
    parentId: null,
    starred: false,
    tags: ['个人'],
    shared: true,
    shareLink: 'https://share.example.com/f/xyz123',
    version: 2
  },
  {
    id: '4',
    name: '设计稿.psd',
    type: 'psd',
    size: 25 * 1024 * 1024, // 25MB
    createdAt: '2023-05-12T16:30:25Z',
    updatedAt: '2023-05-15T16:30:25Z',
    parentId: null,
    url: 'https://example.com/files/design.psd',
    starred: true,
    tags: ['设计', '项目'],
    shared: false,
    shareLink: '',
    version: 3
  },
  {
    id: '5',
    name: '项目计划.docx',
    type: 'docx',
    size: 1.5 * 1024 * 1024, // 1.5MB
    createdAt: '2023-05-16T11:20:15Z',
    updatedAt: '2023-05-18T11:20:15Z',
    parentId: null,
    url: 'https://example.com/files/project_plan.docx',
    starred: false,
    tags: ['文档', '项目'],
    shared: true,
    shareLink: 'https://share.example.com/f/abc456',
    version: 5
  },
  {
    id: '6',
    name: '会议记录.pdf',
    type: 'pdf',
    size: 2.8 * 1024 * 1024, // 2.8MB
    createdAt: '2023-05-18T14:45:30Z',
    updatedAt: '2023-05-20T14:45:30Z',
    parentId: null,
    url: 'https://example.com/files/meeting_notes.pdf',
    starred: false,
    tags: ['会议', '文档'],
    shared: false,
    shareLink: '',
    version: 2
  },
  {
    id: '7',
    name: '演示文稿.pptx',
    type: 'pptx',
    size: 8.2 * 1024 * 1024, // 8.2MB
    createdAt: '2023-05-20T09:15:40Z',
    updatedAt: '2023-05-22T09:15:40Z',
    parentId: null,
    url: 'https://example.com/files/presentation.pptx',
    starred: true,
    tags: ['演示', '项目'],
    shared: true,
    shareLink: 'https://share.example.com/f/def789',
    version: 7
  },
  {
    id: '8',
    name: '风景照片.jpg',
    type: 'jpg',
    size: 4.5 * 1024 * 1024, // 4.5MB
    createdAt: '2023-05-28T10:30:20Z',
    updatedAt: '2023-06-01T10:30:20Z',
    parentId: null,
    url: 'https://example.com/files/landscape.jpg',
    starred: false,
    tags: ['照片', '个人'],
    shared: false,
    shareLink: '',
    version: 1
  },
  {
    id: '9',
    name: '产品视频.mp4',
    type: 'mp4',
    size: 85 * 1024 * 1024, // 85MB
    createdAt: '2023-06-01T16:20:10Z',
    updatedAt: '2023-06-03T16:20:10Z',
    parentId: null,
    url: 'https://example.com/files/product_video.mp4',
    starred: true,
    tags: ['产品', '视频'],
    shared: false,
    shareLink: '',
    version: 2
  },
  {
    id: '10',
    name: '背景音乐.mp3',
    type: 'mp3',
    size: 6.7 * 1024 * 1024, // 6.7MB
    createdAt: '2023-06-05T11:10:35Z',
    updatedAt: '2023-06-07T11:10:35Z',
    parentId: null,
    url: 'https://example.com/files/background_music.mp3',
    starred: false,
    tags: ['音乐', '个人'],
    shared: true,
    shareLink: 'https://share.example.com/f/ghi012',
    version: 1
  }
]);

// 文件夹树结构
const folderTree = ref([
  {
    id: 'root',
    name: '全部文件',
    children: [
      {
        id: '1',
        name: '我的文档',
        children: []
      },
      {
        id: '2',
        name: '项目资料',
        children: []
      },
      {
        id: '3',
        name: '旅行照片',
        children: []
      }
    ]
  }
]);

// 近期访问的文件
const recentFiles = computed(() => {
  // 在实际应用中，这里会从专门的访问记录中获取
  // 此处为演示，我们将所有文件随机排序并取前5个
  return [...files.value]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .map(file => ({
      ...file,
      accessedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
});

// 文件根据当前菜单和筛选条件过滤
const filteredFiles = computed(() => {
  let result = files.value;

  // 如果有搜索，优先按搜索条件过滤
  if (searchQuery.value) {
    return result.filter(file =>
      file.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  // 按当前路径过滤
  result = result.filter(file => {
    // 如果当前路径为空，显示根目录文件
    if (currentPath.value.length === 0) {
      return file.parentId === null;
    }
    // 否则显示当前文件夹下的文件
    return file.parentId === currentPath.value[currentPath.value.length - 1].id;
  });

  // 按当前菜单类型过滤
  switch (activeMenu.value) {
    case 'all':
      // 不需要额外过滤
      break;
    case 'starred':
      result = result.filter(file => file.starred);
      break;
    case 'shared':
      result = result.filter(file => file.shared);
      break;
    case 'images':
      result = result.filter(file => isImage(file.type));
      break;
    case 'documents':
      result = result.filter(file => isDocument(file.type));
      break;
    case 'videos':
      result = result.filter(file => isVideo(file.type));
      break;
    case 'audio':
      result = result.filter(file => isAudio(file.type));
      break;
    case 'trash':
      // 在实际应用中，这会显示已删除的文件
      result = [];
      break;
  }

  // 按当前排序条件排序
  result = [...result].sort((a, b) => {
    switch (currentSort.value) {
      case 'nameAsc':
        return a.name.localeCompare(b.name);
      case 'nameDesc':
        return b.name.localeCompare(a.name);
      case 'dateDesc':
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      case 'dateAsc':
        return new Date(a.updatedAt) - new Date(b.updatedAt);
      case 'sizeDesc':
        return b.size - a.size;
      case 'sizeAsc':
        return a.size - b.size;
      default:
        return 0;
    }
  });

  return result;
});

// 选中的文件
const selectedFiles = ref([]);

// 对话框控制
const uploadDialogVisible = ref(false);
const folderDialogVisible = ref(false);
const renameDialogVisible = ref(false);
const moveDialogVisible = ref(false);
const previewDialogVisible = ref(false);
const fileInfoDialogVisible = ref(false);
const shareDialogVisible = ref(false);

// 表单数据
const folderForm = ref({name: ''});
const renameForm = ref({name: '', id: null});
const moveTarget = ref(null);
const fileList = ref([]);
const previewFile = ref({});
const uploadPercentage = ref(0);
const fileDetail = ref({});
const inputTagVisible = ref(false);
const newTag = ref('');
const shareFile = ref({});
const activeDetailTab = ref('basic');

// 格式化文件大小
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 获取文件夹路径
const getFolderPath = (index) => {
  return {path: '/' + currentPath.value.slice(0, index + 1).map(f => f.id).join('/')};
};

// 处理菜单选择
const handleMenuSelect = (key) => {
  activeMenu.value = key;
  // 清除当前路径，回到根目录
  currentPath.value = [];
};

// 处理文件选择
const selectFile = (file) => {
  const fileId = file.id || file.row.id;
  const index = selectedFiles.value.indexOf(fileId);
  if (index === -1) {
    selectedFiles.value = [fileId];
  } else {
    selectedFiles.value = [];
  }
};

// 切换文件选择
const toggleSelection = (file) => {
  const fileId = file.id || file.row.id;
  const index = selectedFiles.value.indexOf(fileId);
  if (index === -1) {
    selectedFiles.value.push(fileId);
  } else {
    selectedFiles.value.splice(index, 1);
  }
};

// 清除选择
const clearSelection = () => {
  selectedFiles.value = [];
};

// 获取文件类型名称
const getFileTypeName = (type) => {
  if (type === 'folder') return '文件夹';

  const typeMap = {
    'jpg': 'JPEG 图像',
    'jpeg': 'JPEG 图像',
    'png': 'PNG 图像',
    'gif': 'GIF 图像',
    'webp': 'WebP 图像',
    'pdf': 'PDF 文档',
    'doc': 'Word 文档',
    'docx': 'Word 文档',
    'xls': 'Excel 表格',
    'xlsx': 'Excel 表格',
    'ppt': 'PowerPoint 演示文稿',
    'pptx': 'PowerPoint 演示文稿',
    'txt': '文本文件',
    'md': 'Markdown 文件',
    'mp4': 'MP4 视频',
    'webm': 'WebM 视频',
    'mp3': 'MP3 音频',
    'wav': 'WAV 音频',
    'psd': 'Photoshop 文件',
  };

  return typeMap[type] || type.toUpperCase() + ' 文件';
};

// 打开文件
const openFile = (file) => {
  const fileData = file.row || file;
  if (fileData.type === 'folder') {
    // 导航到文件夹
    currentPath.value.push({id: fileData.id, name: fileData.name});
  } else {
    // 预览文件
    if (canPreview(fileData.type)) {
      previewFile.value = fileData;
      previewDialogVisible.value = true;
    } else {
      // 下载文件
      downloadFile(fileData);
    }
  }
};

// 处理文件上传按钮
const handleUpload = () => {
  uploadDialogVisible.value = true;
  fileList.value = [];
  uploadPercentage.value = 0;
};

// 创建文件夹
const createFolder = () => {
  folderForm.value.name = '';
  folderDialogVisible.value = true;
};

// 批量下载
const batchDownload = () => {
  // 在实际应用中，这会批量下载选中的文件
  ElMessage.success(`已开始下载 ${selectedFiles.value.length} 个文件`);
};

// 批量移动
const batchMove = () => {
  // 在实际应用中，这会批量移动选中的文件
  moveTarget.value = null;
  moveDialogVisible.value = true;
};

// 批量删除
const batchDelete = () => {
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedFiles.value.length} 个文件吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 从列表中移除文件
    files.value = files.value.filter(f => !selectedFiles.value.includes(f.id));
    selectedFiles.value = [];
    ElMessage.success('文件已删除');
  }).catch(() => {
    // 取消删除
  });
};

// 提交创建文件夹
const submitCreateFolder = () => {
  if (!folderForm.value.name.trim()) {
    ElMessage.warning('文件夹名称不能为空');
    return;
  }

  // 模拟创建文件夹
  const newFolder = {
    id: 'folder_' + Date.now(),
    name: folderForm.value.name,
    type: 'folder',
    size: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parentId: currentPath.value.length > 0 ? currentPath.value[currentPath.value.length - 1].id : null
  };

  files.value.push(newFolder);
  folderDialogVisible.value = false;
  ElMessage.success('文件夹创建成功');
};

// 判断文件类型
const isImage = (type) => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(type);
const isDocument = (type) => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'].includes(type);
const isVideo = (type) => ['mp4', 'webm', 'avi', 'mov', 'wmv'].includes(type);
const isAudio = (type) => ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(type);

// 判断是否可以预览
const canPreview = (type) => {
  return isImage(type) || isDocument(type) || isVideo(type) || isAudio(type);
};

// 处理命令
const handleCommand = (command, file) => {
  switch (command) {
    case 'preview':
      if (canPreview(file.type)) {
        previewFile.value = file;
        previewDialogVisible.value = true;
      }
      break;
    case 'download':
      downloadFile(file);
      break;
    case 'star':
      toggleStarred(file);
      break;
    case 'share':
      openShareSettings(file);
      break;
    case 'version':
      openVersionDialog(file);
      break;
    case 'permission':
      openPermissionDialog(file);
      break;
    case 'info':
      openFileInfo(file);
      break;
    case 'rename':
      renameForm.value = {name: file.name, id: file.id};
      renameDialogVisible.value = true;
      break;
    case 'move':
      moveTarget.value = file;
      moveDialogVisible.value = true;
      break;
    case 'copy':
      copyFile(file);
      break;
    case 'delete':
      confirmDelete(file);
      break;
  }
};

// 切换文件收藏状态
const toggleStarred = (file) => {
  const fileToUpdate = files.value.find(f => f.id === file.id);
  if (fileToUpdate) {
    fileToUpdate.starred = !fileToUpdate.starred;
    ElMessage.success(fileToUpdate.starred ? '已添加到收藏' : '已从收藏中移除');
  }
};

// 打开分享设置
const openShareSettings = (file) => {
  shareFile.value = {...file};

  // 设置默认分享选项
  shareOptions.value = {
    access: file.shared ? 'anyone' : settings.value.defaultShareAccess,
    password: '',
    expiry: settings.value.defaultShareExpiry,
    expiryDate: '',
    canDownload: settings.value.defaultCanDownload,
    canCopy: settings.value.defaultCanCopy
  };

  shareDialogVisible.value = true;
};

// 生成新的分享链接
const generateNewLink = () => {
  // 实际应用中应该调用后端API生成链接
  shareFile.value.shareLink = `https://share.example.com/f/${Math.random().toString(36).substring(2, 10)}`;
  ElMessage.success('已生成新的分享链接');
};

// 保存分享设置
const saveShareSettings = () => {
  const fileToUpdate = files.value.find(f => f.id === shareFile.value.id);
  if (fileToUpdate) {
    fileToUpdate.shared = shareFile.value.shared;
    fileToUpdate.shareLink = shareFile.value.shareLink;

    if (fileToUpdate.shared && !fileToUpdate.shareLink) {
      // 如果开启分享但没有链接，生成一个
      fileToUpdate.shareLink = `https://share.example.com/f/${Math.random().toString(36).substring(2, 10)}`;
    }

    ElMessage.success(fileToUpdate.shared ? '文件已分享' : '已取消分享');
    shareDialogVisible.value = false;
  }
};

// 复制分享链接
const copyShareLink = () => {
  // 实际应用中应该使用clipboard API
  ElMessage.success('链接已复制到剪贴板');
};

// 打开文件详情
const openFileInfo = (file) => {
  fileDetail.value = {...file};
  fileInfoDialogVisible.value = true;
};

// 标签相关方法
const showTagInput = () => {
  inputTagVisible.value = true;
  // 使用 nextTick 确保DOM更新后再聚焦
  nextTick(() => {
    tagInputRef.value?.focus();
  });
};

const confirmTag = () => {
  if (newTag.value && !fileDetail.value.tags.includes(newTag.value)) {
    fileDetail.value.tags.push(newTag.value.trim());
  }
  inputTagVisible.value = false;
  newTag.value = '';
};

const removeTag = (tag) => {
  fileDetail.value.tags = fileDetail.value.tags.filter(t => t !== tag);
};

const handleFileTags = () => {
  const fileToUpdate = files.value.find(f => f.id === fileDetail.value.id);
  if (fileToUpdate) {
    fileToUpdate.tags = [...fileDetail.value.tags];
    ElMessage.success('文件信息已更新');
    fileInfoDialogVisible.value = false;
  }
};

// 切换暗色模式
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  settings.value.darkMode = isDarkMode.value;
  applyDarkMode();
};

// 应用暗色模式
const applyDarkMode = () => {
  if (settings.value.darkMode) {
    document.documentElement.classList.add('dark-mode');
    ElMessage.success('已切换到暗色模式');
  } else {
    document.documentElement.classList.remove('dark-mode');
    ElMessage.success('已切换到亮色模式');
  }
};

// 打开设置对话框
const openSettings = () => {
  settingsDialogVisible.value = true;
};

// 保存设置
const saveSettings = () => {
  // 应用设置
  viewMode.value = settings.value.defaultView;
  currentSort.value = settings.value.defaultSort;
  applyDarkMode();

  settingsDialogVisible.value = false;
  ElMessage.success('设置已保存');
};

// 预览文件
const openPreview = (file) => {
  previewFile.value = file;
  previewDialogVisible.value = true;
};

// 下载文件
const downloadFile = (file) => {
  // 创建一个虚拟链接并点击它来下载文件
  const link = document.createElement('a');
  link.href = file.url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  ElMessage.success(`开始下载: ${file.name}`);
};

// 提交重命名
const submitRename = () => {
  if (!renameForm.value.name.trim()) {
    ElMessage.warning('文件名不能为空');
    return;
  }

  // 找到要重命名的文件并更新
  const fileToRename = files.value.find(f => f.id === renameForm.value.id);
  if (fileToRename) {
    fileToRename.name = renameForm.value.name;
    renameDialogVisible.value = false;
    ElMessage.success('重命名成功');
  }
};

// 处理树节点点击
const handleNodeClick = (node) => {
  moveTarget.value = node;
};

// 提交移动
const submitMove = () => {
  if (!moveTarget.value) {
    ElMessage.warning('请选择目标文件夹');
    return;
  }

  // 移动选中的所有文件
  selectedFiles.value.forEach(fileId => {
    const fileToMove = files.value.find(f => f.id === fileId);
    if (fileToMove) {
      fileToMove.parentId = moveTarget.value.id === 'root' ? null : moveTarget.value.id;
    }
  });

  moveDialogVisible.value = false;
  ElMessage.success(`已将 ${selectedFiles.value.length} 个文件移动到 ${moveTarget.value.name}`);
};

// 复制文件
const copyFile = (file) => {
  // 创建文件的副本
  const copiedFile = {...file};
  copiedFile.id = 'file_' + Date.now();
  copiedFile.name = `${file.name} - 副本`;
  copiedFile.createdAt = new Date().toISOString();
  copiedFile.updatedAt = new Date().toISOString();
  files.value.push(copiedFile);
  ElMessage.success('文件已复制');
};

// 确认删除
const confirmDelete = (file) => {
  ElMessageBox.confirm(
    `确定要删除 ${file.name} 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 从列表中移除文件
    const index = files.value.findIndex(f => f.id === file.id);
    if (index !== -1) {
      files.value.splice(index, 1);
      ElMessage.success('文件已删除');
    }
  }).catch(() => {
    // 取消删除
  });
};

// 获取表格行的类
const getRowClass = ({row}) => {
  return selectedFiles.value.includes(row.id) ? 'file-row-selected' : '';
};

// 文件上传相关方法
const handlePreview = (file) => {
  console.log(file);
};

const handleRemove = (file, fileList) => {
  console.log(file, fileList);
};

const beforeRemove = (file, fileList) => {
  return ElMessageBox.confirm(`确定移除 ${file.name}？`);
};

const uploadSuccess = (response, file, fileList) => {
  ElMessage.success(`${file.name} 上传成功`);

  // 模拟添加文件到列表
  const newFile = {
    id: 'file_' + Date.now(),
    name: file.name,
    type: file.name.split('.').pop().toLowerCase(),
    size: file.size,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parentId: currentPath.value.length > 0 ? currentPath.value[currentPath.value.length - 1].id : null,
    url: URL.createObjectURL(file.raw)
  };

  files.value.push(newFile);
  uploadPercentage.value = 0;
};

const uploadError = (err, file, fileList) => {
  ElMessage.error(`${file.name} 上传失败`);
  uploadPercentage.value = 0;
};

const uploadProgress = (event, file, fileList) => {
  uploadPercentage.value = Math.round(event.percent);
};

// 页面初始化
onMounted(() => {
  // 在实际应用中，这里会从服务器加载文件数据
});

// 新增状态变量
const isDarkMode = ref(false);
const settingsDialogVisible = ref(false);
const settingsActiveTab = ref('general');

const tagInputRef = ref(null);

// 设置
const settings = ref({
  defaultView: 'grid',
  darkMode: false,
  itemsPerPage: 50,
  defaultSort: 'dateDesc',
  moveToTrashFirst: true,
  defaultShareAccess: 'anyone',
  defaultShareExpiry: '7d',
  defaultCanDownload: true,
  defaultCanCopy: true
});

// 分享选项
const shareOptions = ref({
  access: 'anyone',
  password: '',
  expiry: 'never',
  expiryDate: '',
  canDownload: true,
  canCopy: true
});

// 版本管理对话框
const versionDialogVisible = ref(false);
const versionFile = ref({});
const fileVersions = ref([
  {number: 1, size: 1024, description: '初始版本', current: true},
  {number: 2, size: 1280, description: '添加了一些新功能', current: false},
  {number: 3, size: 1536, description: '修复了一些bug', current: false},
  {number: 4, size: 1792, description: '添加了新的功能', current: false},
  {number: 5, size: 2048, description: '优化了性能', current: false}
]);

// 上传新版本对话框
const uploadVersionDialogVisible = ref(false);
const versionFileList = ref([]);
const versionForm = ref({description: '', setAsCurrent: false});
const versionUploadPercentage = ref(0);

// 文件权限管理对话框
const permissionDialogVisible = ref(false);
const permissionFile = ref({});
const permissionSettings = ref({
  accessLevel: 'private',
  users: [
    {email: 'user1@example.com', role: 'viewer'},
    {email: 'user2@example.com', role: 'editor'},
    {email: 'user3@example.com', role: 'owner'}
  ],
  publicLink: 'https://example.com/share',
  linkExpiry: '7d',
  allowDownload: true,
  allowCopy: true
});

const showAddUserForm = ref(false);
const newUserPermission = ref({email: '', role: 'viewer'});

const editUserPermission = (user) => {
  // 编辑用户权限的逻辑
};

const removeUserPermission = (user) => {
  // 删除用户权限的逻辑
};

const addUserPermission = () => {
  // 添加用户权限的逻辑
};

const copyPublicLink = () => {
  // 复制公开链接的逻辑
};

const savePermissionSettings = () => {
  // 保存权限设置的逻辑
};

const previewVersion = (version) => {
  // 预览版本的逻辑
};

const restoreVersion = (version) => {
  // 恢复版本的逻辑
};

const deleteVersion = (version) => {
  // 删除版本的逻辑
};

const uploadVersionSuccess = (response, file, fileList) => {
  // 上传新版本成功的逻辑
};

const uploadVersionError = (err, file, fileList) => {
  // 上传新版本失败的逻辑
};

const uploadVersionProgress = (event, file, fileList) => {
  versionUploadPercentage.value = Math.round(event.percent);
};

// 上传新版本
const uploadNewVersion = () => {
  versionFileList.value = [];
  versionForm.value = {description: '', setAsCurrent: true};
  versionUploadPercentage.value = 0;
  uploadVersionDialogVisible.value = true;
};

// 确认上传新版本
const confirmUploadVersion = () => {
  if (!versionForm.value.description) {
    ElMessage.warning('请输入版本描述');
    return;
  }

  // 模拟上传成功
  ElMessage.success('新版本上传成功');

  // 更新版本列表
  const newVersion = {
    number: Math.max(...fileVersions.value.map(v => v.number)) + 1,
    size: Math.floor(Math.random() * 1000) + 1000,
    description: versionForm.value.description,
    date: new Date().toLocaleString(),
    current: versionForm.value.setAsCurrent
  };

  if (versionForm.value.setAsCurrent) {
    // 如果设为当前版本，更新其他版本状态
    fileVersions.value.forEach(v => v.current = false);
  }

  fileVersions.value.unshift(newVersion);
  uploadVersionDialogVisible.value = false;
};

const getPermissionText = (file) => {
  if (file.type === 'folder') return '文件夹';
  return `文件夹 - ${file.type}`;
};

const openVersionDialog = (file) => {
  versionFile.value = file;
  versionDialogVisible.value = true;
};

const openPermissionDialog = (file) => {
  permissionFile.value = file;
  permissionDialogVisible.value = true;
};

const previewZoom = ref(1);
const zoomOut = () => {
  previewZoom.value -= 0.1;
};
const zoomIn = () => {
  previewZoom.value += 0.1;
};
const resetZoom = () => {
  previewZoom.value = 1;
};

// 获取过期时间文本
const getExpiryDateText = () => {
  if (shareOptions.value.expiry === 'never') {
    return '永不过期';
  } else if (shareOptions.value.expiry === 'custom' && shareOptions.value.expiryDate) {
    return shareOptions.value.expiryDate;
  } else {
    const days = {
      '1d': 1,
      '7d': 7,
      '30d': 30
    }[shareOptions.value.expiry] || 0;

    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// 生成随机密码
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  shareOptions.value.password = password;
};

// 分享给用户相关变量
const activeShareTab = ref('link');
const newShareUser = ref('');
const newSharePermission = ref('viewer');
const sharedUsers = ref([
  {email: 'user1@example.com', permission: 'viewer', avatar: ''},
  {email: 'user2@example.com', permission: 'editor', avatar: ''}
]);

// 添加分享用户
const addShareUser = () => {
  if (!newShareUser.value) {
    ElMessage.warning('请输入用户邮箱');
    return;
  }

  // 检查邮箱是否已存在
  if (sharedUsers.value.some(user => user.email === newShareUser.value)) {
    ElMessage.warning('该用户已经在分享列表中');
    return;
  }

  sharedUsers.value.push({
    email: newShareUser.value,
    permission: newSharePermission.value,
    avatar: ''
  });

  newShareUser.value = '';
  newSharePermission.value = 'viewer';

  ElMessage.success('已添加用户到分享列表');
};

// 修改用户权限
const changeSharePermission = (user) => {
  user.permission = user.permission === 'viewer' ? 'editor' : 'viewer';
  ElMessage.success(`已将 ${user.email} 的权限修改为 ${user.permission === 'viewer' ? '查看者' : '编辑者'}`);
};

// 移除分享用户
const removeSharedUser = (user) => {
  const index = sharedUsers.value.findIndex(u => u.email === user.email);
  if (index !== -1) {
    sharedUsers.value.splice(index, 1);
    ElMessage.success(`已从分享列表中移除 ${user.email}`);
  }
};
</script>

<style scoped>
/* 基础样式 */
.cloud-drive {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--el-bg-color, #f5f7fa);
  color: var(--el-text-color-primary, #333);
}

/* 头部导航栏 */
.cloud-drive-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: transparent;
  border-bottom: 1px solid var(--el-border-color-light, #e4e7ed);
  position: sticky;
  top: 0;
  z-index: 10;
}

.drive-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.storage-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  width: 250px;
}

.storage-progress {
  width: 100%;
}

.storage-text {
  font-size: 13px;
  color: var(--el-text-color-secondary, #606266);
}

.header-buttons {
  display: flex;
  gap: 8px;
}

/* 主容器布局 */
.cloud-drive-container {
  display: flex;
  flex: 1;
  height: calc(100vh - 69px);
}

/* 左侧侧边栏 */
.cloud-drive-sidebar {
  width: 220px;
  border-right: 1px solid var(--el-border-color-light, #e4e7ed);
  background-color: transparent;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.cloud-menu {
  border-right: none;
  flex: 1;
  background-color: transparent !important;
}

/* 主内容区 */
.cloud-drive-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.content-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
  background-color: var(--el-bg-color, rgba(255, 255, 255, 0.5));
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.content-toolbar:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  border-color: var(--el-color-primary-light-8, #b3d8ff);
}

.left-actions, .right-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.selection-actions {
  margin-left: 12px;
}

.breadcrumb-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 20px;
  background-color: var(--el-bg-color, rgba(255, 255, 255, 0.5));
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

/* 最近访问区域 */
.recent-files-section {
  margin-bottom: 30px;
}

.recent-files-section h3 {
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
}

/* 文件卡片样式 */
.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

.file-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-radius: 12px;
  background-color: var(--el-bg-color, rgba(255, 255, 255, 0.6));
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  transition: all 0.3s;
  backdrop-filter: blur(10px);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.file-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px) scale(1.02);
  border-color: var(--el-color-primary-light-7, #a0cfff);
}

.file-card.is-selected {
  background-color: var(--el-color-primary-light-9, rgba(236, 245, 255, 0.8));
  border-color: var(--el-color-primary, #409eff);
}

.file-checkbox {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 5;
}

.file-action-buttons {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 5;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform: translateY(-5px);
}

.file-card:hover .file-action-buttons {
  opacity: 1;
  transform: translateY(0);
}

.file-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
  background-color: var(--el-bg-color-light, rgba(240, 242, 245, 0.7));
  overflow: hidden;
  transition: all 0.3s ease;
}

.file-card:hover .file-icon {
  background-color: var(--el-bg-color-lighter, rgba(250, 252, 255, 0.7));
}

.file-icon .el-icon {
  font-size: 48px;
  color: var(--el-color-primary, #409eff);
}

.file-icon .el-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
  transition: transform 0.3s ease;
}

.file-card:hover .file-icon .el-image {
  transform: scale(1.05);
}

.file-info {
  text-align: center;
  z-index: 2;
}

.file-name {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s ease;
}

.file-card:hover .file-name {
  color: var(--el-color-primary, #409eff);
}

.file-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

.file-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  margin-top: 10px;
  max-width: 100%;
}

.file-tag {
  font-size: 10px !important;
  height: 18px !important;
  line-height: 16px !important;
  padding: 0 6px !important;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-actions {
  position: absolute;
  bottom: 10px;
  right: 10px;
  opacity: 0;
  z-index: 5;
  transform: translateY(5px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.file-card:hover .file-actions {
  opacity: 1;
  transform: translateY(0);
}

/* 列表视图样式 */
.file-list-view {
  flex: 1;
  background-color: transparent;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  backdrop-filter: blur(8px);
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-name-cell .el-icon {
  font-size: 18px;
  color: #409eff;
}

.file-row-selected {
  background-color: #ecf5ff !important;
}

.table-actions {
  display: flex;
  gap: 8px;
}

/* 预览对话框 */
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: var(--el-bg-color, rgba(255, 255, 255, 0.7));
  border-bottom: 1px solid var(--el-border-color-lighter);
  backdrop-filter: blur(8px);
}

.preview-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.preview-actions {
  display: flex;
  gap: 10px;
}

.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 70vh;
  background-color: var(--el-bg-color-page, #f5f7fa);
  overflow: auto;
  position: relative;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transform: scale(v-bind(previewZoom));
  transition: transform 0.2s ease;
}

.preview-video {
  width: 100%;
  max-height: calc(70vh - 40px);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-audio {
  width: 100%;
  margin-top: 10px;
}

.audio-preview-wrapper {
  background-color: var(--el-bg-color, white);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 400px;
}

.audio-player {
  display: flex;
  align-items: center;
  gap: 20px;
}

.audio-cover {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #409eff, #7cc1ff);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 36px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.preview-document {
  width: 100%;
  height: 70vh;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.preview-unsupported {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: #909399;
  padding: 40px;
  background-color: var(--el-bg-color, white);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.preview-unsupported .el-icon {
  font-size: 72px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.preview-zoom-controls {
  position: absolute;
  bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background-color: var(--el-bg-color, rgba(255, 255, 255, 0.9));
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  z-index: 10;
}

/* 上传对话框 */
.upload-dialog {
  padding: 10px;
}

.upload-area {
  width: 100%;
  margin-bottom: 20px;
}

.upload-content {
  padding: 30px 0;
  text-align: center;
}

.upload-icon {
  font-size: 42px;
  color: #409eff;
  margin-bottom: 10px;
}

.upload-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
}

.upload-hint {
  font-size: 13px;
  color: #909399;
}

.upload-progress {
  margin-top: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 14px;
}

/* 文件夹对话框 */
.folder-dialog {
  padding: 10px;
}

/* 文件夹树 */
.folder-tree {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .cloud-drive-sidebar {
    display: none;
  }

  .content-toolbar {
    flex-direction: column;
  }

  .left-actions, .right-actions {
    width: 100%;
  }

  .file-grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }
}

/* 对话框通用样式 */
:deep(.el-dialog__body) {
  padding-top: 20px;
}

/* 文件详情对话框 */
.file-detail-content {
  padding: 10px;
}

.file-detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.file-detail-icon {
  margin-right: 10px;
}

.file-detail-info {
  flex: 1;
}

.file-detail-info h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.file-detail-info p {
  margin: 5px 0;
  font-size: 14px;
  color: #606266;
}

.file-detail-meta {
  margin-bottom: 10px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.meta-label {
  font-weight: 600;
}

.meta-value {
  color: #909399;
}

.file-detail-tags {
  margin-bottom: 10px;
}

.tags-container {
  display: flex;
  gap: 5px;
}

.file-tag {
  background-color: #f0f0f0;
  padding: 2px 5px;
  border-radius: 4px;
}

.file-share-info {
  margin-top: 10px;
}

.share-link-container {
  display: flex;
  align-items: center;
}

.share-link-container .el-input {
  flex: 1;
}

.share-link-container .el-button {
  margin-left: 5px;
}

/* 分享设置对话框 */
.share-dialog-content {
  padding: 10px;
}

.share-file-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.share-file-icon {
  margin-right: 10px;
}

.share-file-detail {
  flex: 1;
}

.share-file-detail h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.share-file-detail p {
  margin: 5px 0;
  font-size: 14px;
  color: #606266;
}

.share-toggle {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.share-toggle span {
  margin-right: 10px;
}

.share-link-section {
  margin-bottom: 10px;
}

.section-label {
  font-weight: 600;
}

.share-link-container {
  display: flex;
  align-items: center;
}

.share-link-container .el-input {
  flex: 1;
}

.share-link-container .el-button {
  margin-left: 5px;
}

.share-options {
  margin-bottom: 10px;
}

.share-options .el-form-item {
  margin-bottom: 10px;
}

.share-options .el-form-item label {
  font-weight: 600;
}

.share-options .el-form-item .el-radio-group {
  margin-top: 5px;
}

.share-options .el-form-item .el-radio {
  margin-right: 10px;
}

.share-options .el-form-item .el-input {
  width: 100%;
}

.new-link-btn {
  margin-top: 10px;
}

/* 设置对话框 */
.settings-content {
  padding: 10px;
}

.settings-section {
  margin-bottom: 20px;
}

.settings-section h4 {
  margin-bottom: 10px;
  font-weight: 600;
}

.settings-section .el-form {
  margin-bottom: 10px;
}

.settings-section .el-form-item {
  margin-bottom: 5px;
}

.settings-section .el-form-item label {
  font-weight: 600;
}

.settings-section .el-form-item .el-radio-group {
  margin-top: 5px;
}

.settings-section .el-form-item .el-radio {
  margin-right: 10px;
}

.settings-section .el-form-item .el-input {
  width: 100%;
}

.storage-section {
  margin-bottom: 20px;
}

.storage-detail {
  margin-bottom: 10px;
}

.storage-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.storage-breakdown {
  margin-bottom: 10px;
}

.storage-type {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.storage-type span {
  margin-right: 10px;
}

.storage-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sharing-section {
  margin-bottom: 20px;
}

.sharing-section .el-form {
  margin-bottom: 10px;
}

.sharing-section .el-form-item {
  margin-bottom: 5px;
}

.sharing-section .el-form-item label {
  font-weight: 600;
}

.sharing-section .el-form-item .el-radio-group {
  margin-top: 5px;
}

.sharing-section .el-form-item .el-radio {
  margin-right: 10px;
}

.sharing-section .el-form-item .el-input {
  width: 100%;
}

.version-dialog-content {
  padding: 10px;
}

.version-file-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.version-file-icon {
  margin-right: 10px;
}

.version-file-detail {
  flex: 1;
}

.version-file-detail h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.version-file-detail p {
  margin: 5px 0;
  font-size: 14px;
  color: #606266;
}

.version-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.version-list {
  margin-bottom: 20px;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.version-info {
  display: flex;
  align-items: center;
}

.version-number {
  margin-right: 10px;
}

.version-size {
  margin-right: 10px;
}

.version-desc {
  flex: 1;
}

.version-actions {
  display: flex;
  gap: 10px;
}

.upload-version-dialog {
  padding: 10px;
}

.upload-content {
  padding: 30px 0;
  text-align: center;
}

.upload-icon {
  font-size: 42px;
  color: #409eff;
  margin-bottom: 10px;
}

.upload-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
}

.upload-hint {
  font-size: 13px;
  color: #909399;
}

.upload-progress {
  margin-top: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 14px;
}

.version-form {
  margin-bottom: 20px;
}

.version-form .el-form-item {
  margin-bottom: 10px;
}

.version-form .el-form-item label {
  font-weight: 600;
}

.version-form .el-form-item .el-input {
  width: 100%;
}

.permission-dialog-content {
  padding: 20px;
}

.permission-file-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.permission-file-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-color-primary-light-9);
  border-radius: 8px;
}

.permission-file-icon .el-icon {
  font-size: 32px;
  color: var(--el-color-primary);
}

.permission-file-icon .el-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.permission-file-detail {
  flex: 1;
}

.permission-file-detail h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: 600;
}

.permission-file-detail p {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.permission-section {
  margin-bottom: 30px;
}

.permission-section h4 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
}

.permission-access-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  width: 100%;
}

.permission-access-group .el-radio {
  height: auto;
  margin-right: 0;
}

.radio-content {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 15px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.permission-access-group .el-radio.is-checked .radio-content {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.radio-content .el-icon {
  font-size: 24px;
  color: var(--el-color-primary);
}

.radio-text {
  flex: 1;
}

.radio-text div:first-child {
  font-weight: 600;
  margin-bottom: 5px;
}

.radio-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.permission-users-section {
  margin-top: 20px;
}

.user-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.user-list-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.add-user-form {
  background-color: var(--el-bg-color-page);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.add-user-form .el-form-item {
  margin-bottom: 10px;
}

.add-user-form .el-form-item label {
  font-weight: 600;
}

.public-link-section {
  margin-bottom: 10px;
}

.link-container {
  display: flex;
  align-items: center;
}

.link-container .el-input {
  flex: 1;
}

.link-container .el-button {
  margin-left: 5px;
}

.public-options {
  margin-bottom: 10px;
}

.public-options .el-form-item {
  margin-bottom: 10px;
}

.public-options .el-form-item label {
  font-weight: 600;
}

.public-options .el-form-item .el-input {
  width: 100%;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: var(--el-bg-color, rgba(255, 255, 255, 0.8));
  border-radius: 24px;
  padding: 0 6px;
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  transition: all 0.3s ease;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-box:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.search-box .el-input {
  width: 220px;
}

.search-box .el-input :deep(.el-input__wrapper) {
  box-shadow: none !important;
  padding-right: 0;
  background-color: transparent;
}

.search-box .el-input :deep(.el-input__inner) {
  height: 40px;
}

.view-mode-toggle {
  display: flex;
  align-items: center;
  padding: 0 6px;
  border-left: 1px solid var(--el-border-color-lighter);
}

.view-mode-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  margin: 0 2px;
  color: var(--el-text-color-secondary);
  transition: all 0.2s ease;
}

.view-mode-btn:hover {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.view-mode-btn.active {
  background-color: var(--el-color-primary);
  color: white;
}

.preview-dialog {
  width: 85%;
  top: 5vh;
}

.preview-file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-icon {
  font-size: 48px;
  color: #409eff;
}

.preview-meta {
  font-size: 14px;
  color: #909399;
}

.preview-zoom-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.image-preview-wrapper {
  position: relative;
}

.video-preview-wrapper {
  position: relative;
}

.audio-preview-wrapper {
  position: relative;
}

.audio-player {
  display: flex;
  align-items: center;
  gap: 10px;
}

.audio-cover {
  width: 40px;
  height: 40px;
  background-color: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-info {
  flex: 1;
}

.audio-info h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.starred-btn {
  color: #ff7b7b;
}

.preview-dialog :deep(.el-dialog__header) {
  padding: 15px 20px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.preview-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.preview-dialog :deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
}

.file-info-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.file-tabs {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.file-detail-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-label {
  font-weight: 600;
}

.meta-value {
  color: #909399;
}

.meta-with-action {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-tags {
  display: flex;
  gap: 5px;
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-tag .el-icon {
  font-size: 16px;
}

.new-tag-btn {
  margin-top: 10px;
}

.tag-input {
  width: 100%;
}

.file-detail-tags {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-detail-tag {
  display: flex;
  align-items: center;
  gap: 5px;
}

.file-detail-tag .el-icon {
  font-size: 16px;
}

.share-link-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.share-link-container {
  display: flex;
  align-items: center;
}

.share-qrcode {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 150px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.share-qrcode img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.share-dialog {
  /* 分享对话框样式 */
}

.share-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.share-dialog :deep(.el-dialog__header) {
  padding: 15px 20px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.share-dialog-content {
  padding: 20px;
}

.share-file-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.share-file-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-color-primary-light-9);
  border-radius: 8px;
}

.share-file-icon .el-icon {
  font-size: 32px;
  color: var(--el-color-primary);
}

.share-file-icon .el-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.share-file-detail {
  flex: 1;
}

.share-file-detail h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: 600;
}

.share-file-detail p {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.share-toggle {
  margin-left: auto;
}

.share-switch {
  /* 开关样式 */
}

.share-link-section {
  margin-top: 20px;
}

.share-link-container {
  display: flex;
  align-items: center;
}

.link-prepend {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  color: var(--el-color-primary);
}

.share-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 20px;
  gap: 30px;
}

.new-link-btn {
  /* 新链接按钮样式 */
}

.share-qrcode {
  text-align: center;
  flex-shrink: 0;
}

.qrcode-title {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.qrcode-img {
  width: 120px;
  height: 120px;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.qrcode-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.share-options {
  margin-top: 30px;
}

.share-options h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
}

.options-form {
  /* 表单样式 */
}

.access-group {
  width: 100%;
  display: flex;
}

.access-group :deep(.el-radio-button) {
  flex: 1;
}

.password-item {
  /* 密码表单项样式 */
}

.expiry-select {
  width: 100%;
}

.expiry-note {
  margin-top: 10px;
  font-size: 13px;
  color: var(--el-color-warning);
  display: flex;
  align-items: center;
  gap: 5px;
}

.permissions-group {
  margin-bottom: 0;
}

.share-disabled {
  padding: 30px 0;
}
</style>
