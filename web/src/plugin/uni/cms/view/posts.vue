<template>
  <div class="posts-container">
    <LocaleSwitcher
      entity-type="post"
      :get-entity-id="() => editingId"
      :can-translate="() => editingId && editType === 'update'"
      :on-translated="reloadAfterTranslate"
    />

    <div class="posts-layout">
      <!-- 左侧：文章列表 -->
      <div class="posts-list-panel">
        <!-- 搜索栏 -->
        <div class="list-search">
          <el-input
            v-model="searchInfo.search"
            :placeholder="t('plugins.uni.posts.searchTitle')"
            clearable
            prefix-icon="Search"
            @clear="getTableData"
            @keyup.enter="getTableData"
          />
          <el-select v-model="searchInfo.status" :placeholder="t('plugins.uni.posts.allStatus')" clearable style="width: 120px;" @change="getTableData">
            <el-option :label="t('plugins.uni.postStatus.draft')" :value="1" />
            <el-option :label="t('plugins.uni.postStatus.published')" :value="2" />
            <el-option :label="t('plugins.uni.postStatus.archived')" :value="3" />
          </el-select>
          <el-button type="primary" @click="getTableData">
            <el-icon><Search /></el-icon>
          </el-button>
        </div>

        <!-- 新增按钮 -->
        <div class="list-actions">
          <el-button type="primary" size="small" @click="handleNew">
            <el-icon><Plus /></el-icon> {{ t('plugins.uni.posts.newPost') }}
          </el-button>
          <el-button size="small" @click="refreshList" :icon="Refresh" circle />
        </div>

        <!-- 文章列表 -->
        <div class="list-table" v-loading="tableLoading">
          <div
            v-for="item in tableData"
            :key="item.id"
            class="post-item"
            :class="{ active: editingId === item.id }"
            @click="selectPost(item)"
          >
            <div class="post-item-title">{{ getI18nText(item.title) || t('plugins.uni.posts.noTitle') }}</div>
            <div class="post-item-meta">
              <PostStatusTag :status="item.status" />
              <span class="post-item-date">{{ formatDate(item.publishedAt) }}</span>
            </div>
            <div class="post-item-slug">{{ item.slug }}</div>
          </div>

          <el-empty v-if="!tableLoading && tableData.length === 0" :description="t('plugins.uni.posts.noPosts')" />
        </div>

        <!-- 分页 -->
        <div class="list-pagination">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, next"
            small
            @size-change="getTableData"
            @current-change="getTableData"
          />
        </div>
      </div>

      <!-- 右侧：文章编辑 -->
      <div class="posts-edit-panel">
        <template v-if="editMode">
          <!-- 编辑头部 -->
          <div class="edit-header">
            <div class="edit-title">
              <template v-if="editType === 'create'">{{ t('plugins.uni.posts.newPost') }}</template>
              <template v-else>
                <span>{{ t('plugins.uni.posts.editPrefix') }}</span>
                <span class="edit-title-text">{{ getI18nText(formData.title) || t('plugins.uni.posts.noTitle') }}</span>
              </template>
            </div>
            <div class="edit-actions">
              <el-button @click="handleCancel">{{ t('plugins.uni.cancel') }}</el-button>
              <el-button type="info" @click="handleSave(1)" :loading="saveLoading">{{ t('plugins.uni.posts.saveDraft') }}</el-button>
              <el-button type="primary" @click="handleSave(2)" :loading="saveLoading">{{ t('plugins.uni.posts.publish') }}</el-button>
              <el-popconfirm
                v-if="editType === 'update'"
                :title="t('plugins.uni.posts.deleteConfirm')"
                @confirm="handleDelete"
              >
                <template #reference>
                  <el-button type="danger">{{ t('plugins.uni.delete') }}</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>

          <!-- 编辑表单 -->
          <el-scrollbar class="edit-scrollbar">
            <el-form ref="formRef" :model="formData" label-width="110px" v-loading="formLoading" class="edit-form">
              <el-form-item :label="t('plugins.uni.posts.title')" required>
                <el-input v-model="i18n('title').value" :placeholder="t('plugins.uni.posts.enterTitle')" />
              </el-form-item>

              <el-form-item :label="t('plugins.uni.posts.slug')" required>
                <el-input v-model="formData.slug" :placeholder="t('plugins.uni.posts.enterSlug')" />
              </el-form-item>

              <el-form-item :label="t('plugins.uni.posts.excerpt')">
                <el-input v-model="i18n('excerpt').value" type="textarea" :rows="2" :placeholder="t('plugins.uni.posts.enterExcerpt')" />
              </el-form-item>

              <el-form-item :label="t('plugins.uni.posts.content')">
                <RichEdit v-if="editMode" :key="editingId" v-model="i18n('content').value" />
              </el-form-item>

              <el-divider content-position="left">{{ t('plugins.uni.posts.publishSettings') }}</el-divider>

              <el-form-item :label="t('plugins.uni.posts.publishStatus')">
                <el-select v-model="formData.status">
                  <el-option :label="t('plugins.uni.postStatus.draft')" :value="1" />
                  <el-option :label="t('plugins.uni.postStatus.published')" :value="2" />
                </el-select>
              </el-form-item>

              <el-form-item :label="t('plugins.uni.posts.category')">
                <CategoryTreeSelect v-model="formData.categoryIds" type="category" :multiple="true" :placeholder="t('plugins.uni.posts.selectCategory')" />
              </el-form-item>

              <el-form-item :label="t('plugins.uni.posts.tags')">
                <TermSelector v-model="formData.tagIds" type="tag" :placeholder="t('plugins.uni.posts.selectTags')" />
              </el-form-item>

              <el-form-item :label="t('plugins.uni.posts.sortOrder')">
                <el-input-number v-model="formData.sortOrder" :min="0" />
              </el-form-item>

              <el-divider content-position="left">{{ t('plugins.uni.posts.seoSettings') }}</el-divider>

              <el-form-item label="Meta Title">
                <el-input v-model="i18n('metaTitle').value" :placeholder="t('plugins.uni.posts.seoTitle')" />
              </el-form-item>

              <el-form-item label="Meta Description">
                <el-input v-model="i18n('metaDescription').value" type="textarea" :rows="2" :placeholder="t('plugins.uni.posts.seoDescription')" />
              </el-form-item>

              <el-form-item label="Meta Keywords">
                <el-input v-model="i18n('metaKeywords').value" :placeholder="t('plugins.uni.posts.seoKeywords')" />
              </el-form-item>
            </el-form>
          </el-scrollbar>
        </template>

        <!-- 未选中状态 -->
        <div v-else class="edit-placeholder">
          <el-empty :description="t('plugins.uni.posts.selectPostHint')">
            <el-button type="primary" @click="handleNew">{{ t('plugins.uni.posts.newPost') }}</el-button>
          </el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Search, Plus, Refresh } from '@element-plus/icons-vue'
import PostStatusTag from '../components/PostStatusTag.vue'
import TermSelector from '../components/TermSelector.vue'
import CategoryTreeSelect from '../components/CategoryTreeSelect.vue'
import LocaleSwitcher from '../components/LocaleSwitcher.vue'
import RichEdit from '../components/CoreRichEdit.vue'
import { listPosts, getPost, createPost, updatePost, deletePost } from '../api/post.js'
import { useCmsLocaleStore } from '../store/cmsLocale.js'

const { t } = useI18n()
const cmsLocaleStore = useCmsLocaleStore()

// 解析 I18nText，优先显示当前编辑语种的文本
const getI18nText = (val) => {
  if (!val) return ''
  const locale = cmsLocaleStore.activeLocale
  if (typeof val === 'string') {
    try {
      const obj = JSON.parse(val)
      return obj[locale] || obj.zh || obj.en || ''
    } catch {
      return val
    }
  }
  return val[locale] || val.zh || val.en || ''
}

// 解析 I18nText 为 Object
const parseI18nField = (val) => {
  if (!val) return {}
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return {} }
  }
  return val
}

// ---- TipTap/ProseMirror JSON → HTML 转换 ----
const convertNodeToHtml = (node) => {
  if (!node) return ''
  if (node.type === 'text') {
    let t = (node.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    for (const m of (node.marks || [])) {
      if (m.type === 'bold') t = `<strong>${t}</strong>`
      else if (m.type === 'italic') t = `<em>${t}</em>`
      else if (m.type === 'underline') t = `<u>${t}</u>`
      else if (m.type === 'strike') t = `<s>${t}</s>`
      else if (m.type === 'code') t = `<code>${t}</code>`
      else if (m.type === 'link') t = `<a href="${m.attrs?.href || ''}">${t}</a>`
    }
    return t
  }
  const inner = (node.content || []).map(convertNodeToHtml).join('')
  switch (node.type) {
    case 'doc': return inner
    case 'paragraph': return `<p>${inner || '<br>'}</p>`
    case 'heading': return `<h${node.attrs?.level || 1}>${inner}</h${node.attrs?.level || 1}>`
    case 'bulletList': return `<ul>${inner}</ul>`
    case 'orderedList': return `<ol>${inner}</ol>`
    case 'listItem': return `<li>${inner}</li>`
    case 'blockquote': return `<blockquote>${inner}</blockquote>`
    case 'codeBlock': return `<pre><code>${inner}</code></pre>`
    case 'hardBreak': return '<br>'
    case 'horizontalRule': return '<hr>'
    case 'image': return `<img src="${node.attrs?.src || ''}" alt="${node.attrs?.alt || ''}" />`
    default: return inner
  }
}

// 确保 i18n content 字段的每个语种值都是 HTML 字符串
const normalizeI18nContent = (parsed) => {
  const result = {}
  for (const [locale, val] of Object.entries(parsed || {})) {
    if (typeof val === 'string') {
      result[locale] = val
    } else if (val && typeof val === 'object' && val.type) {
      result[locale] = convertNodeToHtml(val)
    } else {
      result[locale] = ''
    }
  }
  return result
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

// i18n 字段绑定：读写当前语言的值
const i18n = (field) => {
  return {
    get value() {
      const obj = formData.value[field]
      return (obj && typeof obj === 'object') ? (obj[cmsLocaleStore.activeLocale] || '') : ''
    },
    set value(val) {
      if (!formData.value[field] || typeof formData.value[field] !== 'object') {
        formData.value[field] = {}
      }
      formData.value[field][cmsLocaleStore.activeLocale] = val
    }
  }
}

// ---- 搜索 & 列表 ----
const searchInfo = ref({ search: '', status: undefined })
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const tableData = ref([])
const tableLoading = ref(false)

const getTableData = async () => {
  tableLoading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      postType: 'post',
      ...searchInfo.value
    }
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key])
    const res = await listPosts(params)
    if (res.code === 0) {
      tableData.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (e) {
    console.error('加载文章列表失败:', e)
  } finally {
    tableLoading.value = false
  }
}

const refreshList = () => {
  getTableData()
}

// ---- 编辑状态 ----
const editMode = ref(false)
const editType = ref('create') // 'create' | 'update'
const formLoading = ref(false)
const saveLoading = ref(false)
const editingId = ref(0)

const formData = ref(createEmptyForm())

function createEmptyForm() {
  return {
    title: {},
    slug: '',
    excerpt: {},
    content: {},
    status: 1,
    sortOrder: 0,
    categoryIds: [],
    tagIds: [],
    metaTitle: {},
    metaDescription: {},
    metaKeywords: {}
  }
}

// 新增文章
const handleNew = () => {
  editingId.value = 0
  formData.value = createEmptyForm()
  editType.value = 'create'
  editMode.value = true
}

// 选中文章 → 加载详情到编辑器
const selectPost = async (item) => {
  // 如果正在编辑同一篇，跳过
  if (editingId.value === item.id && editType.value === 'update') return

  formLoading.value = true
  editMode.value = true
  editType.value = 'update'
  editingId.value = item.id

  try {
    const res = await getPost(item.id)
    if (res.code === 0) {
      const d = res.data
      formData.value = {
        title: parseI18nField(d.title),
        slug: d.slug || '',
        excerpt: parseI18nField(d.excerpt),
        content: normalizeI18nContent(parseI18nField(d.content)),
        status: d.status || 1,
        sortOrder: d.sortOrder || 0,
        categoryIds: d.categoryIds || [],
        tagIds: d.tagIds || [],
        metaTitle: parseI18nField(d.metaTitle),
        metaDescription: parseI18nField(d.metaDescription),
        metaKeywords: parseI18nField(d.metaKeywords)
      }
    }
  } catch (e) {
    console.error('加载文章详情失败:', e)
    ElMessage.error(t('plugins.uni.posts.loadDetailFailed'))
  } finally {
    formLoading.value = false
  }
}

// 取消编辑
const handleCancel = () => {
  editMode.value = false
  editingId.value = 0
  formData.value = createEmptyForm()
}

// 保存
const handleSave = async (status) => {
  saveLoading.value = true
  const data = {
    postType: 'post',
    ...formData.value,
    status,
    title: JSON.stringify(formData.value.title),
    excerpt: JSON.stringify(formData.value.excerpt),
    content: JSON.stringify(formData.value.content),
    metaTitle: JSON.stringify(formData.value.metaTitle),
    metaDescription: JSON.stringify(formData.value.metaDescription),
    metaKeywords: JSON.stringify(formData.value.metaKeywords)
  }

  try {
    let res
    if (editType.value === 'create') {
      res = await createPost(data)
    } else {
      res = await updatePost(editingId.value, data)
    }
    if (res.code === 0) {
      ElMessage.success(status === 2 ? t('plugins.uni.posts.publishSuccess') : t('plugins.uni.saveSuccess'))
      getTableData()
      // 新增成功后切换到编辑模式
      if (editType.value === 'create' && res.data?.id) {
        editingId.value = res.data.id
        editType.value = 'update'
      }
    } else {
      ElMessage.error(res.msg || t('plugins.uni.posts.operationFailed'))
    }
  } catch (e) {
    console.error('保存失败:', e)
    ElMessage.error(t('plugins.uni.saveFailed'))
  } finally {
    saveLoading.value = false
  }
}

// 删除
const handleDelete = async () => {
  try {
    const res = await deletePost(editingId.value)
    if (res.code === 0) {
      ElMessage.success(t('plugins.uni.deleteSuccess'))
      handleCancel()
      getTableData()
    } else {
      ElMessage.error(res.msg || t('plugins.uni.posts.deleteFailed'))
    }
  } catch (e) {
    console.error('删除失败:', e)
  }
}


onMounted(() => {
  getTableData()
  cmsLocaleStore.init()
})

// 翻译完成后重新加载文章详情
const reloadAfterTranslate = async () => {
  if (editingId.value) {
    await selectPost({ id: editingId.value })
  }
}
</script>

<style scoped>
.posts-container {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.posts-layout {
  flex: 1;
  display: flex;
  gap: 0;
  min-height: 0;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

/* ---- 左侧列表 ---- */
.posts-list-panel {
  width: 360px;
  min-width: 300px;
  height: 100%;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  background: #fafafa;
  min-height: 0;
}

.list-search {
  padding: 12px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.list-actions {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.list-table {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.post-item {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.15s;
}

.post-item:hover {
  background: #f0f2f5;
}

.post-item.active {
  background: #ecf5ff;
  border-left: 3px solid #409eff;
  padding-left: 9px;
}

.post-item-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.post-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.post-item-date {
  font-size: 12px;
  color: #909399;
}

.post-item-slug {
  font-size: 12px;
  color: #c0c4cc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-pagination {
  padding: 8px 12px;
  border-top: 1px solid #ebeef5;
  background: #fff;
  flex-shrink: 0;
}

/* ---- 右侧编辑 ---- */
.posts-edit-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.edit-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
  flex-shrink: 0;
}

.edit-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-title-text {
  color: #606266;
  font-weight: 400;
}

.edit-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.edit-scrollbar {
  flex: 1;
  min-height: 0;
}

.edit-form {
  padding: 16px 20px 40px;
  max-width: 900px;
}

.edit-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}
</style>
