import { useRoute, useRouter } from 'vue-router'

export function useGoBack(defaultPath = '/search') {
  const route = useRoute()
  const router = useRouter()

  function safeBackTarget() {
    const value = Array.isArray(route.query.from) ? route.query.from[0] : route.query.from
    if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/product/')) {
      return value
    }
    return defaultPath
  }

  function goBack() {
    router.push(safeBackTarget())
  }

  return { safeBackTarget, goBack }
}
