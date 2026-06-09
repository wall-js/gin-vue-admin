<template>
  <div>
    <LocaleSwitcher />

    <div class="gva-search-box">
      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchInfo" class="demo-form-inline">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.search" placeholder="搜索标题" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchInfo.status" placeholder="全部" clearable>
            <el-option label="草稿" :value="1" />
            <el-option label="已发布" :value="2" />
            <el-option label="已归档" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="gva-table-box">
      <div style="margin-bottom: 12px;">
        <el-button type="primary" @click="openDialog('create')">新增文章</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" border style="width: 100%" v-loading="tableLoading">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column label="标题" min-width="200">
          <template #default="{ row }">
            <span>{{ getI18nText(row.title) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="slug" label="Slug" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <PostStatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="180">
          <template #default="{ row }">
            <span>{{ formatDate(row.publishedAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDialog('update', row)">编辑</el-button>
            <el-popconfirm title="确定删除此文章？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button type="danger" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top: 12px; display: flex; justify-content: flex-end;">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getTableData"
          @current-change="getTableData"
        />
      </div>
    </div>

    <!-- 文章编辑抽屉 -->
    <el-drawer
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增文章' : '编辑文章'"
      size="70%"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" label-width="100px" v-loading="formLoading">
        <el-form-item label="标题" required>
          <el-input v-model="i18n('title').value" placeholder="请输入标题" />
        </el-form-item>

        <el-form-item label="Slug" required>
          <el-input v-model="formData.slug" placeholder="请输入 URL Slug" />
        </el-form-item>

        <el-form-item label="摘要">
          <el-input v-model="i18n('excerpt').value" type="textarea" :rows="2" placeholder="请输入摘要" />
        </el-form-item>

        <el-form-item label="内容">
          <RichEdit v-if="dialogVisible" :key="editingId" v-model="i18n('content').value" />
        </el-form-item>

        <el-divider content-position="left">发布设置</el-divider>

        <el-form-item label="发布状态">
          <el-select v-model="formData.status">
            <el-option label="草稿" :value="1" />
            <el-option label="已发布" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="分类">
          <TermSelector v-model="formData.termIds" type="category" placeholder="选择分类" />
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number v-model="formData.sortOrder" :min="0" />
        </el-form-item>

        <el-divider content-position="left">SEO 设置</el-divider>

        <el-form-item label="Meta Title">
          <el-input v-model="i18n('metaTitle').value" placeholder="SEO 标题" />
        </el-form-item>

        <el-form-item label="Meta Description">
          <el-input v-model="i18n('metaDescription').value" type="textarea" :rows="2" placeholder="SEO 描述" />
        </el-form-item>

        <el-form-item label="Meta Keywords">
          <el-input v-model="i18n('metaKeywords').value" placeholder="SEO 关键词" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="info" @click="handleSave(1)">保存草稿</el-button>
          <el-button type="primary" @click="handleSave(2)">发布</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PostStatusTag from '../components/PostStatusTag.vue'
import TermSelector from '../components/TermSelector.vue'
import LocaleSwitcher from '../components/LocaleSwitcher.vue'
import RichEdit from '@/components/richtext/rich-edit.vue'
import { listPosts, getPost, createPost, updatePost, deletePost } from '../api/post.js'
import { useCmsLocaleStore } from '../store/cmsLocale.js'

const cmsLocaleStore = useCmsLocaleStore()

// 解析 I18nText，优先显示当前编辑语种的文本
const getI18nText = (val) => {
  if (!val) return ''
  const locale = cmsLocaleStore.activeLocale
  if (typeof val === 'string') {
    try {
      const obj = JSON.parse(val)
      return obj[locale] || obj.zh || obj.en || val
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

// 确保 i18n content 字段的每个语种值都是 HTML 字符串（处理 TipTap JSON 格式）
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

// 搜索
const searchInfo = ref({ search: '', status: undefined })
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 表格
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
    // 移除 undefined 值
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

const resetSearch = () => {
  searchInfo.value = { search: '', status: undefined }
  page.value = 1
  getTableData()
}

// 对话框
const dialogVisible = ref(false)
const dialogType = ref('create')
const formLoading = ref(false)
const editingId = ref(0)

const formData = ref({
  title: {},
  slug: '',
  excerpt: {},
  content: {},
  status: 1,
  sortOrder: 0,
  termIds: [],
  metaTitle: {},
  metaDescription: {},
  metaKeywords: {}
})

const resetForm = () => {
  editingId.value = 0
  formData.value = {
    title: {},
    slug: '',
    excerpt: {},
    content: {},
    status: 1,
    sortOrder: 0,
    termIds: [],
    metaTitle: {},
    metaDescription: {},
    metaKeywords: {}
  }
}

const openDialog = async (type, row) => {
  dialogType.value = type
  resetForm()

  if (type === 'update' && row) {
    formLoading.value = true
    try {
      const res = await getPost(row.id)
      console.log('[CMS] getPost response:', JSON.stringify(res))
      if (res.code === 0) {
        const d = res.data
        formData.value = {
          title: parseI18nField(d.title),
          slug: d.slug || '',
          excerpt: parseI18nField(d.excerpt),
          content: normalizeI18nContent(parseI18nField(d.content)),
          status: d.status || 1,
          sortOrder: d.sortOrder || 0,
          termIds: d.termIds || [],
          metaTitle: parseI18nField(d.metaTitle),
          metaDescription: parseI18nField(d.metaDescription),
          metaKeywords: parseI18nField(d.metaKeywords)
        }
        editingId.value = d.id
        console.log('[CMS] formData set:', JSON.stringify(formData.value), 'locale:', cmsLocaleStore.activeLocale)
      }
    } catch (e) {
      console.error('加载文章详情失败:', e)
    } finally {
      formLoading.value = false
    }
  }

  dialogVisible.value = true
}

const handleSave = async (status) => {
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
    if (dialogType.value === 'create') {
      res = await createPost(data)
    } else {
      res = await updatePost(editingId.value, data)
    }
    if (res.code === 0) {
      ElMessage.success(status === 2 ? '发布成功' : '保存成功')
      dialogVisible.value = false
      getTableData()
    } else {
      ElMessage.error(res.msg || '操作失败')
    }
  } catch (e) {
    console.error('保存失败:', e)
  }
}

const handleDelete = async (row) => {
  try {
    const res = await deletePost(row.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      getTableData()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (e) {
    console.error('删除失败:', e)
  }
}

// 加载站点语言配置（已迁移到 cmsLocaleStore）

onMounted(() => {
  getTableData()
  cmsLocaleStore.init()
})
</script>

<style scoped>
.gva-search-box {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  margin-bottom: 10px;
}
.gva-table-box {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}
</style>
