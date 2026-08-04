<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo" @keyup.enter="onSubmit">
        <el-form-item label="场景名称">
          <el-input
            v-model="searchInfo.name"
            placeholder="请输入场景名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-select
            v-model="searchInfo.enabled"
            placeholder="请选择"
            clearable
          >
            <el-option label="已启用" :value="true" />
            <el-option label="已停用" :value="false" />
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
        <el-button type="primary" icon="plus" disabled>新建场景</el-button>
      </div>
      <el-table :data="tableData" row-key="id">
        <el-table-column label="场景名称" prop="name" min-width="120" />
        <el-table-column label="触发条件" prop="trigger" min-width="180" />
        <el-table-column label="执行动作" prop="action" min-width="180" />
        <el-table-column label="启用状态" prop="enabled" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? '已启用' : '已停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近执行时间" prop="lastRunAt" min-width="160" />
        <template #empty>
          <div class="flex flex-col items-center gap-2 py-10">
            <span>暂无场景数据</span>
            <span class="text-sm opacity-60">
              IoT 后端接口尚未实现，接入后将在此展示场景联动规则
            </span>
          </div>
        </template>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

defineOptions({ name: 'IotScene' })

// IoT 后端接口尚未实现，当前为静态占位数据源，接入后替换为分页查询
const tableData = ref([])

const searchInfo = reactive({
  name: '',
  enabled: undefined,
})

const onSubmit = () => {
  // TODO: 接入场景规则查询接口
}

const onReset = () => {
  searchInfo.name = ''
  searchInfo.enabled = undefined
}
</script>
