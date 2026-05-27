<template>
  <div class="not-found">
    <h1>404</h1>
    <p>页面未找到</p>
    <router-link to="/" class="back-link">返回首页</router-link>
  </div>
</template>

<script setup>
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}
.not-found h1 {
  font-size: 5rem;
  color: #ccc;
  margin-bottom: 0.5rem;
}
.not-found p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 1.5rem;
}
.back-link {
  padding: 0.6rem 1.5rem;
  background: #3b82f6;
  color: #fff;
  border-radius: 6px;
  text-decoration: none;
}
.back-link:hover {
  background: #2563eb;
}
</style>
