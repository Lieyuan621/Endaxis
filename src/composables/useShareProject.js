import { useRoute, useRouter } from 'vue-router'
import { useTimelineStore } from '@/stores/timelineStore'
import { ElMessage } from 'element-plus'

export function useShareProject() {
    const route = useRoute()
    const router = useRouter()
    const store = useTimelineStore()

    function checkUrlForImport() {
        console.log(route.query, route.query.scenario)
        if (route.query.scenario) {
            const importStr = route.query.scenario
            const success = store.importShareString(importStr)
            if (success) {
                ElMessage.success('已从分享链接加载项目')
            } else {
                ElMessage.error('分享链接无效或已损坏')
            }
            router.replace({ query: {} })
        }
    }

    function generateShareLink() {
        try {
            const shareStr = store.exportShareString()
            const url = `${window.location.origin}${window.location.pathname}?scenario=${shareStr}`

            navigator.clipboard.writeText(url).then(() => {
                ElMessage.success('分享链接已复制到剪贴板！')
            }).catch(err => {
                console.error('Copy failed', err)
                ElMessage.warning('复制失败，请手动复制地址栏链接')
            })
        } catch (e) {
            console.error(e)
            ElMessage.error('分享生成失败: ' + e.message)
        }
    }

    return {
        checkUrlForImport,
        generateShareLink,
    }
}
