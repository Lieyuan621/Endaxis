import { useTimelineStore } from '@/stores/timelineStore'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

export function useShareProject() {
    const store = useTimelineStore()
    const { t } = useI18n({ useScope: 'global' })

    // 1. 复制分享码
    async function copyShareCode() {
        try {
            // 获取压缩后的长字符串
            const shareStr = await store.exportShareString()

            // 写入剪贴板
            await navigator.clipboard.writeText(shareStr)
            ElMessage.success(t('timeline.share.copied'))
        } catch (e) {
            console.error(e)
            ElMessage.error(t('timeline.share.copyFailed', { msg: e?.message || '' }))
        }
    }

    // 2. 解析导入分享码
    function importFromCode(code) {
        if (!code) {
            ElMessage.warning(t('timeline.share.inputRequired'))
            return false
        }

        // 调用 Store 里的解压和合并逻辑
        const success = store.importShareString(code)

        if (success) {
            ElMessage.success(t('timeline.share.imported'))
            return true
        } else {
            ElMessage.error(t('timeline.share.importFailed'))
            return false
        }
    }

    return {
        copyShareCode,
        importFromCode
    }
}