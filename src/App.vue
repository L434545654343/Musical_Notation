<template>
  <div>
    <nav style="padding: 16px; border-bottom: 1px solid #eee; display: flex; gap: 12px;">
      <router-link to="/">Home</router-link>
      <router-link to="/upload">Upload</router-link>
      <router-link v-if="!session" to="/auth">Auth</router-link>

      <div style="margin-left:auto; display:flex; gap:12px; align-items:center;">
        <span v-if="session">已登录：{{ session.user.email }}</span>
        <button v-if="session" @click="signOut" :disabled="loading">退出</button>
      </div>
    </nav>

    <router-view />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { supabase } from './lib/supabaseClient'

const session = ref(null)
const loading = ref(false)
let sub

async function refreshSession() {
  const { data } = await supabase.auth.getSession()
  session.value = data.session
}

async function signOut() {
  loading.value = true
  try {
    await supabase.auth.signOut()
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await refreshSession()
  const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession
  })
  sub = data.subscription
})

onUnmounted(() => {
  sub?.unsubscribe()
})
</script>