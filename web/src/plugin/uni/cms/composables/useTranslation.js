import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { translateEntity, translateTaskStatus } from '../api/translation.js'
import { useCmsLocaleStore } from '../store/cmsLocale.js'

/**
 * AI 翻译 composable — 供 LocaleSwitcher 组件内部使用。
 *
 * @param {Object} options
 * @param {() => string} options.getEntityType  - 返回当前实体类型 "post"|"term"|"menu"|"site"|"media"
 * @param {() => number|null} options.getEntityId - 返回当前实体 ID（site 类型可为 null）
 * @param {() => boolean} [options.canTranslate] - 可选，判断是否允许翻译（如未选中编辑项时返回 false）
 * @param {(locale: string) => Promise<void>} [options.onTranslated] - 翻译完成后的回调（用于重新加载数据）
 */
export function useTranslation({ getEntityType, getEntityId, canTranslate, onTranslated }) {
  const cmsLocaleStore = useCmsLocaleStore()

  // ---- 状态 ----
  const dialogVisible = ref(false)
  const targetLocales = ref([])
  const loading = ref(false)
  const progress = ref(0)
  const force = ref(false)
  // 翻译进度详情
  const translatedCount = ref(0)
  const totalCount = ref(0)
  const failedCount = ref(0)
  const phase = ref('')          // 'idle' | 'submitting' | 'translating' | 'done' | 'error'
  const statusText = ref('')

  const availableTargets = computed(() => {
    return (cmsLocaleStore.availableLocales || []).filter(l => l !== cmsLocaleStore.activeLocale)
  })

  // ---- 方法 ----
  const openDialog = () => {
    if (canTranslate && !canTranslate()) {
      ElMessage.warning('请先选择一个条目进行编辑')
      return
    }
    targetLocales.value = []
    progress.value = 0
    translatedCount.value = 0
    totalCount.value = 0
    failedCount.value = 0
    phase.value = 'idle'
    statusText.value = ''
    force.value = false
    dialogVisible.value = true
  }

  const handleTranslate = async () => {
    if (targetLocales.value.length === 0) {
      ElMessage.warning('请至少选择一个目标语种')
      return
    }

    const entityType = getEntityType()
    const entityId = getEntityId()

    // site 类型不需要 entityId（使用上下文中的 siteId）
    if (entityType !== 'site' && !entityId) {
      ElMessage.warning('无效的实体 ID')
      return
    }

    loading.value = true
    progress.value = 0
    phase.value = 'submitting'
    statusText.value = '正在提交翻译任务...'

    try {
      const res = await translateEntity({
        entityType,
        entityId: entityId || 0,
        sourceLocale: cmsLocaleStore.activeLocale,
        targetLocales: targetLocales.value,
        force: force.value
      })

      if (res.code !== 0) {
        phase.value = 'error'
        statusText.value = res.msg || '翻译任务启动失败'
        loading.value = false
        return
      }

      const { taskId } = res.data
      if (!taskId) {
        ElMessage.info('没有需要翻译的内容')
        phase.value = 'idle'
        statusText.value = ''
        dialogVisible.value = false
        loading.value = false
        return
      }

      // 轮询任务状态
      phase.value = 'translating'
      statusText.value = '正在翻译中...'
      progress.value = 2

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await translateTaskStatus(taskId)
          if (statusRes.code !== 0) {
            clearInterval(pollInterval)
            phase.value = 'error'
            statusText.value = statusRes.msg || '查询状态失败'
            loading.value = false
            return
          }

          const d = statusRes.data
          translatedCount.value = d.translated || 0
          failedCount.value = d.failed || 0
          totalCount.value = d.total || 0

          if (d.total > 0) {
            const done = (d.translated || 0) + (d.failed || 0)
            progress.value = Math.min(95, Math.round((done / d.total) * 95))
            statusText.value = `正在翻译... ${done}/${d.total}`
          }

          if (d.status === 'completed' || d.status === 'failed') {
            clearInterval(pollInterval)
            progress.value = 100

            if (d.status === 'completed') {
              phase.value = 'done'
              const failMsg = d.failed > 0 ? `，失败 ${d.failed} 个` : ''
              statusText.value = `翻译完成：成功 ${d.translated} 个字段${failMsg}`

              // 延迟 1.2 秒后关闭弹窗，让用户看到进度条完成状态
              setTimeout(async () => {
                dialogVisible.value = false
                ElMessage.success(statusText.value)
                if (onTranslated) {
                  await onTranslated(cmsLocaleStore.activeLocale)
                }
              }, 1200)
            } else {
              phase.value = 'error'
              statusText.value = d.error || '翻译失败'
            }
            loading.value = false
          }
        } catch (e) {
          clearInterval(pollInterval)
          console.error('查询翻译状态失败:', e)
          phase.value = 'error'
          statusText.value = '查询翻译状态失败'
          loading.value = false
        }
      }, 500)

    } catch (e) {
      console.error('翻译失败:', e)
      phase.value = 'error'
      statusText.value = '翻译请求失败'
      loading.value = false
      progress.value = 0
    }
  }

  return {
    dialogVisible,
    targetLocales,
    loading,
    progress,
    force,
    translatedCount,
    totalCount,
    failedCount,
    phase,
    statusText,
    availableTargets,
    openDialog,
    handleTranslate
  }
}
