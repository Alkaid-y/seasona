import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { apiErrorMessage } from '../api/http'

export function useAddToCart() {
  const router = useRouter()
  const cart = useCartStore()
  const busy = ref(false)

  async function addToCart(skuId, quantity = 1, showNotice) {
    busy.value = true
    try {
      await cart.addSku(skuId, quantity, true)
      if (showNotice) showNotice('已加入购物车')
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        router.push('/auth')
        return
      }
      if (showNotice) showNotice(apiErrorMessage(error, '加入购物车失败'))
    } finally {
      busy.value = false
    }
  }

  return { addToCart, busy }
}
