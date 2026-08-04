<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo" @keyup.enter="onSubmit">
        <el-form-item label="告警级别">
          <el-select
            v-model="searchInfo.level"
            placeholder="请选择"
            clearable
          >
            <el-option label="紧急" value="critical" />
            <el-option label="重要" value="major" />
            <el-option label="一般" value="minor" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select
            v-model="searchInfo.handled"
            placeholder="请选择"
            clearable
          >
            <el-option label="未处理" :value="false" />
            <el-option label="已处理" :value="true" />
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
      <el-table :data="tableData" row-key="id">
        <el-table-column label="告警内容" prop="content" min-width="180" />
        <el-table-column label="告警级别" prop="level" min-width="100">
          <template #default="{ row }">
            <el-tag :type="levelTagType(row.level)">
              {{ levelLabel(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关联设备" prop="deviceName" min-width="120" />
        <el-table-column label="处理状态" prop="handled" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.handled ? 'success' : 'warning'">
              {{ row.handled ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发生时间" prop="createdAt" min-width="160" />
        <template #empty>
          <div class="flex flex-col items-center gap-2 py-10">
            <span>暂无告警数据</span>
            <span class="text-sm opacity-60">
              IoT 后端接口尚未实现，接入后将在此展示告警记录
            </span>
          </div>
        </template>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

defineOptions({ name: 'IotAlert' })

// IoT 后端接口尚未实现，当前为静态占位数据源，接入后替换为分页查询
const tableData = ref([])

const searchInfo = reactive({
  level: '',
  handled: undefined,
})

const LEVEL_OPTIONS = {
  critical: { label: '紧急', type: 'danger' },
  major: { label: '重要', type: 'warning' },
  minor: { label: '一般', type: 'info' },
}

const levelLabel = (level) => LEVEL_OPTIONS[level]?.label ?? level
const levelTagType = (level) => LEVEL_OPTIONS[level]?.type ?? 'info'

const onSubmit = () => {
  // TODO: 接入告警记录查询接口
}

const onReset = () => {
  searchInfo.level = ''
  searchInfo.handled = undefined
}
</script>
