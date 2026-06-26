<template>
  <div v-loading.fullscreen.lock="fullscreenLoading">
    <div class="flex gap-4 p-2">
      <!-- 左侧：分类树 -->
      <div class="flex-none w-64 bg-white text-slate-700 dark:text-slate-400 dark:bg-slate-900 rounded p-4">
        <el-scrollbar style="height: calc(100vh - 300px)">
          <el-tree
            :data="categories"
            node-key="ID"
            :props="defaultProps"
            @node-click="handleNodeClick"
            default-expand-all
          >
            <template #default="{ node, data }">
              <div class="w-36" :class="search.classId === data.ID ? 'text-blue-500 font-bold' : ''">{{ data.name }}</div>
              <el-dropdown>
                <el-icon class="ml-3 text-right" v-if="data.ID > 0"><MoreFilled /></el-icon>
                <el-icon class="ml-3 text-right mt-1" v-else><Plus /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="addCategoryFun(data)">添加子分类</el-dropdown-item>
                    <el-dropdown-item @click="editCategory(data)" v-if="data.ID > 0">编辑分类</el-dropdown-item>
                    <el-dropdown-item @click="deleteCategoryFun(data.ID)" v-if="data.ID > 0">删除分类</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-tree>
        </el-scrollbar>
      </div>

      <!-- 右侧：文件管理 -->
      <div class="flex-1 bg-white text-slate-700 dark:text-slate-400 dark:bg-slate-900">
        <div class="gva-table-box mt-0 mb-0">
          <div class="gva-btn-list gap-3">
            <!-- 自定义文件上传 -->
            <el-button type="primary" icon="Upload" :loading="uploading" @click="triggerUpload">
              {{ uploading ? '上传中...' : '上传文件' }}
            </el-button>
            <input
              ref="fileInput"
              type="file"
              multiple
              style="display: none;"
              @change="handleFileChange"
            />

            <el-button type="primary" icon="Link" @click="importUrlFunc">导入URL</el-button>
            <el-input
              v-model="search.keyword"
              class="w-72"
              placeholder="输入文件名搜索"
              @keyup.enter="onSubmit"
            />
            <el-button type="primary" icon="Search" @click="onSubmit">搜索</el-button>
          </div>

          <el-table :data="tableData" v-loading="loading">
            <el-table-column align="left" label="预览" width="100">
              <template #default="scope">
                <el-image
                  v-if="isImage(scope.row.tag)"
                  :src="getFileUrl(scope.row)"
                  :preview-src-list="[getFileUrl(scope.row)]"
                  fit="cover"
                  style="width: 60px; height: 60px;"
                  preview-teleported
                />
                <el-icon v-else style="font-size: 36px; color: #909399;"><Document /></el-icon>
              </template>
            </el-table-column>
            <el-table-column align="left" label="上传时间" prop="UpdatedAt" width="180">
              <template #default="scope">
                <div>{{ scope.row.UpdatedAt }}</div>
              </template>
            </el-table-column>
            <el-table-column align="left" label="文件名/备注" prop="name" width="200">
              <template #default="scope">
                <div class="cursor-pointer hover:text-blue-500" @click="editFileNameFunc(scope.row)">
                  {{ scope.row.name }}
                </div>
              </template>
            </el-table-column>
            <el-table-column align="left" label="链接" prop="url" min-width="300">
              <template #default="scope">
                <el-link type="primary" :href="getFileUrl(scope.row)" target="_blank" :underline="false">
                  {{ scope.row.url }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column align="left" label="标签" prop="tag" width="80">
              <template #default="scope">
                <el-tag
                  :type="scope.row.tag?.toLowerCase() === 'jpg' || scope.row.tag?.toLowerCase() === 'png' ? 'info' : 'success'"
                  disable-transitions
                >{{ scope.row.tag }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column align="left" label="操作" width="260">
              <template #default="scope">
                <el-button icon="Sort" type="primary" link @click="openMoveDialog(scope.row)">移动</el-button>
                <el-button icon="Download" type="primary" link @click="downloadFile(scope.row)">下载</el-button>
                <el-button icon="Delete" type="primary" link @click="deleteFileFunc(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="gva-pagination">
            <el-pagination
              :current-page="page"
              :page-size="pageSize"
              :page-sizes="[10, 30, 50, 100]"
              :style="{ float: 'right', padding: '20px' }"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="handleCurrentChange"
              @size-change="handleSizeChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑分类弹窗 -->
    <el-dialog v-model="categoryDialogVisible" @close="closeAddCategoryDialog" width="520"
               :title="(categoryFormData.ID === 0 ? '添加' : '编辑') + '分类'" draggable>
      <el-form ref="categoryForm" :rules="rules" :model="categoryFormData" label-width="120px">
        <el-form-item label="父级分类">
          <el-tree-select
            v-model="categoryFormData.pid"
            :data="categories"
            check-strictly
            :props="defaultProps"
            :render-after-expand="false"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model.trim="categoryFormData.name" placeholder="请输入分类名称"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeAddCategoryDialog">取消</el-button>
        <el-button type="primary" @click="confirmAddCategory">确定</el-button>
      </template>
    </el-dialog>
    <!-- 移动分类弹窗 -->
    <el-dialog v-model="moveDialogVisible" title="移动到分类" width="420" draggable>
      <el-tree-select
        v-model="moveClassId"
        :data="categories"
        check-strictly
        :props="defaultProps"
        :render-after-expand="false"
        placeholder="选择目标分类"
        style="width: 100%"
      />
      <template #footer>
        <el-button @click="moveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMoveFile">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled, Plus, Document } from '@element-plus/icons-vue'
import {
  getFileList,
  deleteFile,
  editFileName,
  importURL,
  getCategoryList,
  addCategory,
  deleteCategory
} from '../api/media'
import { uploadFileToCore } from '../../utils/upload'
import { useUserStore } from '@/pinia/modules/user'

defineOptions({
  name: 'MediaLibrary'
})

const userStore = useUserStore()

const fullscreenLoading = ref(false)
const loading = ref(false)
const uploading = ref(false)
const fileInput = ref(null)

// 触发文件选择框
const triggerUpload = () => {
  fileInput.value?.click()
}

// 文件选择后上传
const handleFileChange = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return
  uploading.value = true
  try {
    for (let i = 0; i < files.length; i++) {
      const res = await uploadFileToCore(files[i], { classId: search.value.classId })
      if (res.code !== 0) {
        ElMessage.error(res.msg || '上传失败')
        return
      }
    }
    ElMessage.success(`成功上传 ${files.length} 个文件`)
    search.value.keyword = null
    page.value = 1
    getTableData()
  } catch (e) {
    ElMessage.error('上传失败: ' + (e.message || '网络错误'))
  } finally {
    uploading.value = false
    // 清空 input，以便重复选择同一文件
    if (fileInput.value) fileInput.value.value = ''
  }
}

const page = ref(1)
const total = ref(0)
const pageSize = ref(10)
const search = ref({
  keyword: null,
  classId: 0
})
const tableData = ref([])

const defaultProps = {
  children: 'children',
  label: 'name',
  value: 'ID'
}

// 判断是否是图片
const isImage = (tag) => {
  if (!tag) return false
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(tag.toLowerCase())
}

// 获取文件完整 URL
const getFileUrl = (row) => {
  if (row.url && (row.url.indexOf('http://') > -1 || row.url.indexOf('https://') > -1)) {
    return row.url
  }
  return '/api/v1/core' + row.url
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  getTableData()
}

const handleCurrentChange = (val) => {
  page.value = val
  getTableData()
}

const onSubmit = () => {
  search.value.classId = 0
  page.value = 1
  getTableData()
}

// 查询文件列表
const getTableData = async () => {
  loading.value = true
  try {
    const table = await getFileList({
      page: page.value,
      pageSize: pageSize.value,
      ...search.value
    })
    if (table.code === 0) {
      tableData.value = table.data.list || []
      total.value = table.data.total
      page.value = table.data.page
      pageSize.value = table.data.pageSize
    }
  } finally {
    loading.value = false
  }
}
getTableData()

// 上传成功回调已移至 handleFileChange 内部

// 删除文件
const deleteFileFunc = async (row) => {
  ElMessageBox.confirm('确定要删除此文件吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const res = await deleteFile(row)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      if (tableData.value.length === 1 && page.value > 1) {
        page.value--
      }
      await getTableData()
    }
  }).catch(() => {
    ElMessage.info('取消删除')
  })
}

// 下载文件
const downloadFile = (row) => {
  const url = getFileUrl(row)
  const link = document.createElement('a')
  link.href = url
  link.download = row.name || 'download'
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 编辑文件名
const editFileNameFunc = async (row) => {
  ElMessageBox.prompt('请输入文件名或备注', '编辑', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /\S/,
    inputErrorMessage: '不能为空',
    inputValue: row.name
  }).then(async ({ value }) => {
    const res = await editFileName({ ID: row.ID, name: value })
    if (res.code === 0) {
      ElMessage.success('编辑成功')
      await getTableData()
    }
  }).catch(() => {
    ElMessage.info('取消修改')
  })
}

// 导入URL
const importUrlFunc = () => {
  ElMessageBox.prompt(
    '每行一个URL，格式: 文件名|URL 或纯URL',
    '导入URL',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '示例:\nimage1.png|https://example.com/img1.png\nhttps://example.com/img2.png',
      inputPattern: /\S/,
      inputErrorMessage: '不能为空'
    }
  ).then(async ({ value }) => {
    let lines = value.split('\n')
    let importData = []
    lines.forEach((item) => {
      let parts = item.trim().split('|')
      let url, name
      if (parts.length > 1) {
        name = parts[0].trim()
        url = parts[1].trim()
      } else {
        url = parts[0].trim()
        let str = url.substring(url.lastIndexOf('/') + 1)
        name = str.substring(0, str.lastIndexOf('.'))
      }
      if (url) {
        importData.push({
          name: name,
          url: url,
          classId: search.value.classId,
          tag: url.substring(url.lastIndexOf('.') + 1),
          key: Math.random().toString(36).substring(2, 15)
        })
      }
    })

    const res = await importURL({ items: importData })
    if (res.code === 0) {
      ElMessage.success('导入成功')
      await getTableData()
    }
  }).catch(() => {
    ElMessage.info('取消导入')
  })
}

// ===== 分类相关 =====
const categories = ref([])

const fetchCategories = async () => {
  const res = await getCategoryList()
  let root = {
    name: '全部分类',
    ID: 0,
    pid: 0,
    children: []
  }
  if (res.code === 0) {
    categories.value = res.data || []
    categories.value.unshift(root)
  }
}

const handleNodeClick = (node) => {
  search.value.keyword = null
  search.value.classId = node.ID
  page.value = 1
  getTableData()
}

// 分类弹窗
const categoryDialogVisible = ref(false)
const categoryFormData = ref({ ID: 0, pid: 0, name: '' })
const categoryForm = ref(null)
const rules = ref({
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { max: 20, message: '分类名称不能超过20个字符', trigger: 'blur' }
  ]
})

const addCategoryFun = (category) => {
  categoryDialogVisible.value = true
  categoryFormData.value.ID = 0
  categoryFormData.value.pid = category.ID
}

const editCategory = (category) => {
  categoryFormData.value = {
    ID: category.ID,
    pid: category.pid,
    name: category.name
  }
  categoryDialogVisible.value = true
}

const deleteCategoryFun = async (id) => {
  const res = await deleteCategory({ id: id })
  if (res.code === 0) {
    ElMessage.success('删除成功')
    await fetchCategories()
  } else {
    ElMessage.error(res.msg || '删除失败')
  }
}

const confirmAddCategory = async () => {
  categoryForm.value.validate(async valid => {
    if (valid) {
      const res = await addCategory(categoryFormData.value)
      if (res.code === 0) {
        ElMessage.success('操作成功')
        await fetchCategories()
        closeAddCategoryDialog()
      } else {
        ElMessage.error(res.msg || '操作失败')
      }
    }
  })
}

const closeAddCategoryDialog = () => {
  categoryDialogVisible.value = false
  categoryFormData.value = { ID: 0, pid: 0, name: '' }
}

fetchCategories()

// ===== 移动分类 =====
const moveDialogVisible = ref(false)
const moveFileId = ref(0)
const moveClassId = ref(0)

const openMoveDialog = (row) => {
  moveFileId.value = row.ID
  moveClassId.value = row.classId || 0
  moveDialogVisible.value = true
}

const confirmMoveFile = async () => {
  const res = await editFileName({ ID: moveFileId.value, classId: moveClassId.value })
  if (res.code === 0) {
    ElMessage.success('移动成功')
    moveDialogVisible.value = false
    await getTableData()
  } else {
    ElMessage.error(res.msg || '移动失败')
  }
}
</script>
