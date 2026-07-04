<template>
  <div class="border border-solid border-gray-100 h-full z-10">
    <Toolbar
      :editor="editorRef"
      :default-config="toolbarConfig"
      mode="default"
    />
    <Editor
      v-model="valueHtml"
      class="overflow-y-hidden mt-0.5"
      style="height: 18rem"
      :default-config="editorConfig"
      mode="default"
      @onCreated="handleCreated"
      @onChange="change"
    />
  </div>
</template>

<script setup>
  import '@wangeditor/editor/dist/css/style.css' // 引入 css

  import { onBeforeUnmount, ref, shallowRef, watch } from 'vue'
  import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

  import { ElMessage } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import { uploadFileToCore } from '@/plugin/uni/utils/upload'

  const { t } = useI18n()

  const emits = defineEmits(['change', 'update:modelValue'])

  const change = (editor) => {
    emits('change', editor)
    emits('update:modelValue', valueHtml.value)
  }

  const props = defineProps({
    modelValue: {
      type: String,
      default: ''
    }
  })

  const editorRef = shallowRef()
  const valueHtml = ref('')

  const toolbarConfig = {}
  const editorConfig = {
    placeholder: t('components.richtext.placeholder'),
    MENU_CONF: {}
  }
  // 图片上传：通过 Core 媒体库服务上传（multipart/form-data）
  editorConfig.MENU_CONF['uploadImage'] = {
    async customUpload(file, insertFn) {
      try {
        const res = await uploadFileToCore(file)
        if (res.code === 0) {
          const url = res.data.file.url
          const fullUrl = url.startsWith('http') ? url : '/api/v1/core' + url
          insertFn(fullUrl, res.data.file.name)
        } else {
          ElMessage.error(res.msg || t('components.richtext.imageUploadFailed'))
        }
      } catch (e) {
        ElMessage.error(t('components.richtext.imageUploadFailed') + ': ' + (e.message || t('components.richtext.networkError')))
      }
    }
  }

  // 组件销毁时，也及时销毁编辑器
  onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
  })

  const handleCreated = (editor) => {
    editorRef.value = editor
    valueHtml.value = props.modelValue
  }

  watch(
    () => props.modelValue,
    (newVal) => {
      valueHtml.value = newVal || ''
    }
  )
</script>

<style scoped lang="scss">

</style>
