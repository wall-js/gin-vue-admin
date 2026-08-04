<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo" @keyup.enter="onSubmit">
        <el-form-item label="设备名称">
          <el-input
            v-model="searchInfo.name"
            placeholder="请输入设备名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="在线状态">
          <el-select
            v-model="searchInfo.online"
            placeholder="请选择"
            clearable
          >
            <el-option label="在线" :value="true" />
            <el-option label="离线" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" @click="onSubmit">
            查询
          </el-button>
          <el-button icon="refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="gva-table-box">
      <div class="gva-btn-list">
        <el-button type="primary" icon="plus" disabled>新建设备</el-button>
      </div>
      <el-table :data="tableData" row-key="id">
        <el-table-column label="设备名称" prop="name" min-width="120" />
        <el-table-column label="设备编号" prop="code" min-width="120" />
        <el-table-column label="所属产品" prop="product" min-width="120" />
        <el-table-column label="在线状态" prop="online" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.online ? 'success' : 'info'">
              {{ row.online ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="最后上线时间"
          prop="lastOnlineAt"
          min-width="160"
        />
        <template #empty>
          <div class="flex flex-col items-center gap-2 py-10">
            <span>暂无设备数据</span>
            <span class="text-sm opacity-60">
              IoT 后端接口尚未实现，接入后将在此展示设备列表
            </span>
          </div>
        </template>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

defineOptions({ name: 'IotDevice' })

// IoT 后端接口尚未实现，当前为静态占位数据源，接入后替换为分页查询
const tableData = ref([])

const searchInfo = reactive({
  name: '',
  online: undefined,
})

const onSubmit = () => {
  // TODO: 接入设备列表查询接口
}

const onReset = () => {
  searchInfo.name = ''
  searchInfo.online = undefined
}
</script>
