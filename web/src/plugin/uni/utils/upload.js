import axios from 'axios'
import { useUserStore } from '@/pinia/modules/user'

/**
 * 上传文件到 Core 媒体库服务（multipart/form-data）
 *
 * 独立于 corePost，因为其 axios 拦截器强制 Content-Type: application/json 会破坏 FormData。
 * 浏览器发送 FormData 时会自动设置正确的 multipart/form-data boundary。
 *
 * @param {File} file     文件对象（来自 input[type=file] 或 WangEditor customUpload）
 * @param {object} [opts]
 * @param {number} [opts.classId]   分类 ID，默认 0
 * @param {boolean} [opts.noSave]   仅上传不落库（富文本内联图片场景），默认 false
 * @returns {Promise<{code: number, data: object, msg: string}>}
 */
export const uploadFileToCore = (file, opts = {}) => {
  const userStore = useUserStore()
  const siteId = localStorage.getItem('cms_site_id') || ''
  const formData = new FormData()
  formData.append('file', file)
  if (opts.classId != null) {
    formData.append('classId', String(opts.classId))
  }

  let url = '/api/v1/core/fileUploadAndDownload/upload'
  if (opts.noSave) {
    url += '?noSave=1'
  }

  return axios.post(url, formData, {
    headers: {
      'x-token': userStore.token,
      'x-user-id': userStore.userInfo.ID,
      'X-Admin-Site-Id': siteId
    },
    timeout: 120000
  }).then(res => res.data)
}
