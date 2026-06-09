<template>
  <div class="locale-switcher" v-loading="loading">
    <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
      <el-tab-pane
        v-for="locale in availableLocales"
        :key="locale"
        :label="localeLabel(locale)"
        :name="locale"
      />
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useCmsLocaleStore } from '../store/cmsLocale.js'

const cmsLocaleStore = useCmsLocaleStore()

const loading = computed(() => cmsLocaleStore.loading)
const availableLocales = computed(() => cmsLocaleStore.availableLocales)
const activeTab = ref(cmsLocaleStore.activeLocale)

// 监听 store 变化，同步 tab 状态
watch(() => cmsLocaleStore.activeLocale, (newVal) => {
  activeTab.value = newVal
})

const localeLabels = { zh: '中文', en: 'English', ar: 'العربية', ru: 'Русский' }
const localeLabel = (locale) => localeLabels[locale] || locale.toUpperCase()

const handleTabChange = (locale) => {
  cmsLocaleStore.setLocale(locale)
}

onMounted(() => {
  cmsLocaleStore.init()
})
</script>

<style scoped>
.locale-switcher {
  margin-bottom: 16px;
}
.locale-switcher :deep(.el-tabs__header) {
  margin-bottom: 0;
}
</style>
