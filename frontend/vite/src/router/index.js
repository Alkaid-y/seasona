import { createRouter, createWebHistory } from 'vue-router'

const SITE_TITLE = '拾季'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue'), meta: { title: '首页' } },
  { path: '/search', name: 'search', component: () => import('../views/SearchView.vue'), meta: { title: '搜索' } },
  { path: '/merchant/:id', name: 'merchant-store', component: () => import('../views/MerchantStoreView.vue'), meta: { title: '店铺' } },
  { path: '/product/:id', name: 'product-detail', component: () => import('../views/ProductDetailView.vue'), meta: { title: '商品详情' } },
  { path: '/product/:id/reviews', name: 'product-reviews', component: () => import('../views/ProductReviewsView.vue'), meta: { title: '商品评价' } },
  { path: '/product/:id/review/write', name: 'review-write', component: () => import('../views/ReviewWriteView.vue'), meta: { title: '写评价', requiresAuth: true } },
  { path: '/reviews/:id', name: 'review-detail', component: () => import('../views/ReviewDetailView.vue'), meta: { title: '评价详情' } },
  { path: '/auth', name: 'auth', component: () => import('../views/AuthView.vue'), meta: { title: '登录注册' } },
  { path: '/password-reset', name: 'password-reset', component: () => import('../views/PasswordResetView.vue'), meta: { title: '重置密码' } },
  { path: '/seller/register', name: 'seller-register', component: () => import('../views/SellerRegisterView.vue'), meta: { title: '商家入驻' } },
  { path: '/ai', name: 'ai', component: () => import('../views/AiView.vue'), meta: { title: '小拾助手', requiresAuth: true } },
  { path: '/cart', name: 'cart', component: () => import('../views/CartView.vue'), meta: { title: '购物车', requiresAuth: true } },
  { path: '/checkout', name: 'checkout', component: () => import('../views/CheckoutView.vue'), meta: { title: '结算', requiresAuth: true } },
  { path: '/payments', name: 'buyer-payments', component: () => import('../views/PaymentListBuyerView.vue'), meta: { title: '我的支付', requiresAuth: true } },
  { path: '/payments/:id', name: 'buyer-payment-detail', component: () => import('../views/PaymentDetailBuyerView.vue'), meta: { title: '支付详情', requiresAuth: true } },
  { path: '/profile', name: 'buyer-profile', component: () => import('../views/BuyerProfileView.vue'), meta: { title: '我的', requiresAuth: true } },
  { path: '/profile/edit', name: 'buyer-profile-edit', component: () => import('../views/ProfileEditView.vue'), meta: { title: '编辑资料', requiresAuth: true } },
  { path: '/wallet', name: 'buyer-wallet', component: () => import('../views/WalletView.vue'), meta: { title: '我的钱包', requiresAuth: true } },
  { path: '/orders', name: 'buyer-orders', component: () => import('../views/OrdersView.vue'), meta: { title: '我的订单', requiresAuth: true } },
  { path: '/orders/:id', name: 'buyer-order-detail', component: () => import('../views/OrderDetailBuyerView.vue'), meta: { title: '订单详情', requiresAuth: true } },
  { path: '/reviews', name: 'buyer-reviews', component: () => import('../views/ReviewsView.vue'), meta: { title: '我的评价', requiresAuth: true } },
  { path: '/seller/wallet-ledger', name: 'seller-wallet-ledger', component: () => import('../views/SellerWalletLedgerView.vue'), meta: { title: '卖家钱包', requiresAuth: true, role: 'seller' } },
  { path: '/seller/orders/:id', name: 'seller-order-detail', component: () => import('../views/SellerOrderDetailView.vue'), meta: { title: '卖家订单详情', requiresAuth: true, role: 'seller' } },
  { path: '/seller', name: 'seller', component: () => import('../views/SellerDashboardView.vue'), meta: { title: '卖家中心', requiresAuth: true, role: 'seller' } },
  { path: '/admin', name: 'admin', component: () => import('../views/AdminDashboardView.vue'), meta: { title: '管理后台', requiresAuth: true, role: 'admin' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue'), meta: { title: '页面未找到' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0, behavior: 'smooth' }
  },
})

router.beforeEach((to) => {
  const token = window.localStorage.getItem('seasona_token')
  const role = window.localStorage.getItem('seasona_role')

  if (to.meta.requiresAuth && !token) {
    return { path: '/auth', query: { from: to.fullPath } }
  }

  if (token && role === 'seller' && !to.path.startsWith('/seller') && to.meta.role !== 'seller') {
    return { path: '/seller' }
  }
  if (token && role === 'admin' && !to.path.startsWith('/admin') && to.meta.role !== 'admin') {
    return { path: '/admin' }
  }
  return true
})

router.afterEach((to) => {
  const title = to.meta.title ? `${to.meta.title} - ${SITE_TITLE}` : SITE_TITLE
  document.title = title
})

export default router
