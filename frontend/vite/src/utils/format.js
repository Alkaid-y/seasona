export function money(value) {
  return Number(value || 0).toFixed(2)
}

export function moneyYen(value) {
  return `¥ ${Number(value || 0).toFixed(2)}`
}

export function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function displayReviewName(review) {
  const name = review?.buyer_nickname || review?.buyer_username || '买家'
  return name.length > 12 ? `${name.slice(0, 12)}*` : name
}
