<template>
  <div class="locale-switcher" v-loading="isLoading">
    <div class="locale-switcher-inner">
      <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
        <el-tab-pane
          v-for="locale in availableLocales"
          :key="locale"
          :label="localeLabel(locale)"
          :name="locale"
        />
      </el-tabs>
      <el-button
        v-if="entityType"
        type="primary"
        :icon="MagicStick"
        size="small"
        class="translate-btn"
        @click="openDialog"
      >
        {{ t('plugins.uni.localeSwitcher.aiTranslate') }}
      </el-button>
    </div>

    <!-- AI 翻译弹窗 -->
    <el-dialog v-model="dialogVisible" :title="t('plugins.uni.localeSwitcher.aiTranslateTitle')" width="480px" :close-on-click-modal="false">
      <!-- 配置区：提交前显示 -->
      <template v-if="phase === 'idle' || phase === ''">
        <el-form label-width="100px">
          <el-form-item :label="t('plugins.uni.localeSwitcher.sourceLang')">
            <el-tag>{{ localeLabel(cmsLocaleStore.activeLocale) }}</el-tag>
          </el-form-item>
          <el-form-item :label="t('plugins.uni.localeSwitcher.targetLang')" required>
            <el-checkbox-group v-model="targetLocales">
              <el-checkbox
                v-for="loc in availableTargets"
                :key="loc"
                :label="loc"
                :value="loc"
              >
                {{ localeLabel(loc) }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="force">
              {{ t('plugins.uni.localeSwitcher.forceOverwrite') }}
            </el-checkbox>
          </el-form-item>
        </el-form>
      </template>

      <!-- 进度区：提交后显示 -->
      <template v-else>
        <div class="translate-progress">
          <div class="translate-progress-header">
            <span class="translate-progress-title">
              <template v-if="phase === 'submitting'">{{ t('plugins.uni.localeSwitcher.submitting') }}</template>
              <template v-else-if="phase === 'translating'">{{ t('plugins.uni.localeSwitcher.translating') }}</template>
              <template v-else-if="phase === 'done'">{{ t('plugins.uni.localeSwitcher.translateDone') }}</template>
              <template v-else-if="phase === 'error'">{{ t('plugins.uni.localeSwitcher.translateFailed') }}</template>
            </span>
            <span v-if="phase === 'translating' && totalCount > 0" class="translate-progress-count">
              {{ translatedCount }}/{{ totalCount }}
            </span>
          </div>
          <el-progress
            :percentage="progress"
            :stroke-width="14"
            :status="phase === 'done' ? 'success' : phase === 'error' ? 'exception' : ''"
            :show-text="true"
          />
          <p class="translate-progress-text">{{ statusText }}</p>
        </div>
      </template>

      <template #footer>
        <el-button @click="dialogVisible = false" :disabled="translateLoading">{{ t('plugins.uni.cancel') }}</el-button>
        <el-button
          v-if="phase === 'idle' || phase === '' || phase === 'error'"
          type="primary"
          @click="handleTranslate"
          :loading="translateLoading"
          :disabled="targetLocales.length === 0"
        >
          {{ t('plugins.uni.localeSwitcher.startTranslate') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MagicStick } from '@element-plus/icons-vue'
import { useCmsLocaleStore } from '../store/cmsLocale.js'
import { useTranslation } from '../composables/useTranslation.js'

const props = defineProps({
  /** 实体类型："post"|"term"|"menu"|"site"|"media"，传入则显示翻译按钮 */
  entityType: { type: String, default: '' },
  /** 返回当前编辑实体 ID 的函数 */
  getEntityId: { type: Function, default: () => null },
  /** 判断是否允许翻译的函数（可选，如检查是否已选中编辑项） */
  canTranslate: { type: Function, default: null },
  /** 翻译完成后的回调（可选，用于重新加载数据） */
  onTranslated: { type: Function, default: null }
})

const emit = defineEmits(['translated'])

const { t } = useI18n()
const cmsLocaleStore = useCmsLocaleStore()

const loading = computed(() => cmsLocaleStore.loading)
const availableLocales = computed(() => cmsLocaleStore.availableLocales)
const activeTab = ref(cmsLocaleStore.activeLocale)

// 监听 store 变化，同步 tab 状态
watch(() => cmsLocaleStore.activeLocale, (newVal) => {
  activeTab.value = newVal
})

const localeLabels = { zh: '中文', 'zh-TW': '繁體中文', en: 'English', ar: 'العربية', ru: 'Русский' }
const localeLabel = (locale) => localeLabels[locale] || locale.toUpperCase()

const handleTabChange = (locale) => {
  cmsLocaleStore.setLocale(locale)
}

// ---- AI 翻译 ----
const {
  dialogVisible,
  targetLocales,
  progress,
  force,
  translatedCount,
  totalCount,
  phase,
  statusText,
  availableTargets,
  openDialog,
  handleTranslate,
  loading: translateLoading
} = useTranslation({
  getEntityType: () => props.entityType,
  getEntityId: () => props.getEntityId(),
  canTranslate: props.canTranslate ? () => props.canTranslate() : undefined,
  onTranslated: async (locale) => {
    if (props.onTranslated) {
      await props.onTranslated(locale)
    }
    emit('translated', locale)
  }
})

// 合并 loading 状态（翻译时也禁用 tab）
const isLoading = computed(() => loading.value || translateLoading.value)

onMounted(() => {
  cmsLocaleStore.init()
})
</script>

<style scoped>
.locale-switcher {
  margin-bottom: 16px;
}
.locale-switcher-inner {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}
.locale-switcher-inner :deep(.el-tabs) {
  flex: 1;
}
.locale-switcher-inner :deep(.el-tabs__header) {
  margin-bottom: 0;
}
.translate-btn {
  flex-shrink: 0;
  margin-bottom: 0;
}

/* 翻译进度区 */
.translate-progress {
  padding: 16px 4px;
  text-align: center;
}
.translate-progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.translate-progress-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.translate-progress-count {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
}
.translate-progress-text {
  margin-top: 12px;
  color: #909399;
  font-size: 13px;
}
</style>
