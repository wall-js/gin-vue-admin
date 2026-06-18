<template>
  <div>
    <div class="gva-search-box">
      <div class="gva-table-box">
        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <h2 style="margin: 0;">站点管理</h2>
            <el-tag v-if="activeSiteName" type="success" size="large" effect="dark">
              当前维护：{{ activeSiteName }}
            </el-tag>
            <el-tag v-else type="info" size="large">未选择站点</el-tag>
          </div>
          <div style="display: flex; gap: 8px;">
            <el-button v-if="activeSiteId" type="warning" @click="handleClearSite">清除切换</el-button>
            <el-button type="primary" @click="loadSites">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>

        <el-table :data="siteList" v-loading="loading" stripe style="width: 100%"
          :row-class-name="tableRowClassName">
          <el-table-column label="ID" prop="id" width="80" />
          <el-table-column label="站点名称" min-width="200">
            <template #default="{ row }">
              <span>{{ parseName(row.name) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="域名" prop="domain" min-width="180">
            <template #default="{ row }">
              <el-tag v-if="row.domain" type="success" size="small">{{ row.domain }}</el-tag>
              <span v-else style="color: #999;">未绑定</span>
            </template>
          </el-table-column>
          <el-table-column label="默认语言" prop="locale" width="100" />
          <el-table-column label="模板" prop="template" width="120" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'warning'" size="small">
                {{ row.status === 1 ? '正常' : '维护中' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
              <el-button v-if="activeSiteId !== row.id" type="success" link @click="handleSwitchSite(row)">切换</el-button>
              <el-tag v-else type="success" size="small" effect="dark">当前</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 编辑抽屉 -->
    <el-drawer v-model="drawerVisible" :title="`编辑站点 - ${editSiteName}`" size="520px" direction="rtl">
      <el-form :model="editForm" label-width="100px" v-loading="editLoading">
        <el-form-item label="站点名称">
          <el-input v-model="editNameValue" placeholder="请输入站点名称" />
        </el-form-item>
        <el-form-item label="绑定域名">
          <el-input v-model="editForm.domain" placeholder="如 example.com" />
        </el-form-item>
        <el-form-item label="默认语言">
          <el-select v-model="editForm.locale" placeholder="请选择">
            <el-option label="中文" value="zh" />
            <el-option label="繁體中文" value="zh-TW" />
            <el-option label="English" value="en" />
            <el-option label="العربية" value="ar" />
            <el-option label="Русский" value="ru" />
          </el-select>
        </el-form-item>
        <el-form-item label="可用语言">
          <el-select v-model="editLocalesList" multiple placeholder="请选择可用语言">
            <el-option label="中文" value="zh" />
            <el-option label="繁體中文" value="zh-TW" />
            <el-option label="English" value="en" />
            <el-option label="العربية" value="ar" />
            <el-option label="Русский" value="ru" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板">
          <el-input v-model="editForm.template" placeholder="模板名称" />
        </el-form-item>
        <el-form-item label="Favicon URL">
          <el-input v-model="editForm.faviconUrl" placeholder="Favicon URL" />
        </el-form-item>
        <el-form-item label="站点状态">
          <el-radio-group v-model="editForm.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="2">维护中</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { listSites, getSite, updateSite } from '../api/site.js'

const loading = ref(false)
const siteList = ref([])

// 当前激活站点
const activeSiteId = ref(Number(localStorage.getItem('cms_site_id')) || null)
const activeSiteName = computed(() => {
  if (!activeSiteId.value) return ''
  const site = siteList.value.find(s => s.id === activeSiteId.value)
  return site ? parseName(site.name) : ''
})

// 编辑相关
const drawerVisible = ref(false)
const editLoading = ref(false)
const saveLoading = ref(false)
const editingSiteId = ref(null)
const editSiteName = ref('')
const editForm = ref({
  domain: '',
  locale: 'zh',
  locales: '["zh","en"]',
  template: 'default',
  faviconUrl: '',
  status: 1,
  _full: null
})

// 解析 I18nText JSON 获取显示名称
const parseName = (name) => {
  if (!name) return '-'
  if (typeof name === 'string') {
    try {
      const obj = JSON.parse(name)
      return obj.zh || obj.en || obj['zh-TW'] || Object.values(obj)[0] || name
    } catch {
      return name
    }
  }
  if (typeof name === 'object') {
    return name.zh || name.en || name['zh-TW'] || Object.values(name)[0] || '-'
  }
  return name
}

// 编辑时的站点名称
const editNameValue = computed({
  get() {
    const full = editForm.value._full
    if (!full) return ''
    const name = full.name
    if (typeof name === 'string') {
      try {
        const obj = JSON.parse(name)
        return obj.zh || obj.en || Object.values(obj)[0] || ''
      } catch {
        return name
      }
    }
    return (name && typeof name === 'object') ? (name.zh || name.en || '') : ''
  },
  set(val) {
    const full = editForm.value._full
    if (!full) return
    let name = full.name
    if (typeof name === 'string') {
      try { name = JSON.parse(name) } catch { name = {} }
    }
    if (typeof name !== 'object') name = {}
    name.zh = val
    full.name = JSON.stringify(name)
  }
})

// 可用语言列表绑定
const editLocalesList = computed({
  get() {
    try {
      return JSON.parse(editForm.value.locales)
    } catch {
      return ['zh']
    }
  },
  set(val) {
    editForm.value.locales = JSON.stringify(val)
  }
})

// 临时切换 site_id 执行请求，完成后恢复
const withSiteId = async (siteId, fn) => {
  const original = localStorage.getItem('cms_site_id')
  localStorage.setItem('cms_site_id', String(siteId))
  try {
    return await fn()
  } finally {
    if (original) {
      localStorage.setItem('cms_site_id', original)
    } else {
      localStorage.removeItem('cms_site_id')
    }
  }
}

// 加载站点列表
const loadSites = async () => {
  loading.value = true
  try {
    const res = await listSites()
    if (res.code === 0) {
      siteList.value = res.data.list || []
    } else {
      ElMessage.error(res.msg || '加载失败')
    }
  } catch (e) {
    console.error('加载站点列表失败:', e)
  } finally {
    loading.value = false
  }
}

// 打开编辑抽屉
const handleEdit = async (row) => {
  editingSiteId.value = row.id
  editSiteName.value = parseName(row.name)
  editLoading.value = true
  drawerVisible.value = true

  try {
    const res = await withSiteId(row.id, () => getSite())
    if (res.code === 0) {
      const data = res.data
      editForm.value = {
        domain: data.domain || '',
        locale: data.locale || 'zh',
        locales: data.locales || '["zh","en"]',
        template: data.template || 'default',
        faviconUrl: data.faviconUrl || '',
        status: data.status || 1,
        _full: data
      }
    } else {
      ElMessage.error('加载站点详情失败')
      drawerVisible.value = false
    }
  } catch (e) {
    console.error('加载站点详情失败:', e)
    drawerVisible.value = false
  } finally {
    editLoading.value = false
  }
}

// 保存编辑
const handleSaveEdit = async () => {
  saveLoading.value = true
  try {
    const full = editForm.value._full
    const data = {
      name: typeof full.name === 'string' ? full.name : JSON.stringify(full.name || {}),
      description: typeof full.description === 'string' ? full.description : JSON.stringify(full.description || {}),
      logoUrl: typeof full.logoUrl === 'string' ? full.logoUrl : JSON.stringify(full.logoUrl || {}),
      faviconUrl: editForm.value.faviconUrl || '',
      locale: editForm.value.locale,
      locales: editForm.value.locales,
      template: editForm.value.template,
      metaTitle: typeof full.metaTitle === 'string' ? full.metaTitle : JSON.stringify(full.metaTitle || {}),
      metaDescription: typeof full.metaDescription === 'string' ? full.metaDescription : JSON.stringify(full.metaDescription || {}),
      metaKeywords: typeof full.metaKeywords === 'string' ? full.metaKeywords : JSON.stringify(full.metaKeywords || {}),
      settingsJson: typeof full.settingsJson === 'string' ? full.settingsJson : JSON.stringify(full.settingsJson || {}),
      domain: editForm.value.domain || '',
      status: editForm.value.status
    }

    const res = await withSiteId(editingSiteId.value, () => updateSite(data))
    if (res.code === 0) {
      ElMessage.success('保存成功')
      drawerVisible.value = false
      loadSites()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    console.error('保存失败:', e)
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

// 切换当前维护站点（设置 cms_site_id，所有 CMS 页面生效）
const handleSwitchSite = (row) => {
  activeSiteId.value = row.id
  localStorage.setItem('cms_site_id', String(row.id))
  ElMessage.success(`已切换到站点：${parseName(row.name)}`)
}

// 清除站点切换
const handleClearSite = () => {
  activeSiteId.value = null
  localStorage.removeItem('cms_site_id')
  ElMessage.info('已清除站点切换')
}

// 高亮当前激活站点行
const tableRowClassName = ({ row }) => {
  return row.id === activeSiteId.value ? 'active-site-row' : ''
}

onMounted(() => {
  loadSites()
})
</script>

<style scoped>
.gva-table-box {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}

:deep(.active-site-row) {
  background-color: #f0f9eb !important;
}

:deep(.active-site-row td) {
  background-color: #f0f9eb !important;
}
</style>
