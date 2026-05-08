<template>
  <div class="wrap">
    <h2>Supabase 邮箱+密码登录</h2>

    <div class="card">
      <div v-if="session" class="row">
        <div>当前用户：<b>{{ session.user.email }}</b></div>
        <button class="btn" @click="signOut" :disabled="loading">退出登录</button>
      </div>

      <div v-else class="form">
        <label class="label">
          Email
          <input class="input" v-model.trim="email" type="email" placeholder="you@example.com" />
        </label>

        <label class="label">
          Password
          <input class="input" v-model.trim="password" type="password" placeholder="至少 6 位" />
        </label>

        <div class="actions">
          <button class="btn" @click="signUp" :disabled="loading || !email || !password">
            注册
          </button>
          <button class="btn primary" @click="signIn" :disabled="loading || !email || !password">
            登录
          </button>
        </div>
      </div>

      <p v-if="loading" class="hint">处理中…</p>
      <p v-if="msg" class="msg">{{ msg }}</p>
      <p v-if="error" class="err">{{ error }}</p>
    </div>

    <p class="hint">
      提示：如果你在 Supabase 开启了“邮箱确认（Confirm email）”，注册后需要去邮箱点确认链接，才能登录成功。
    </p>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { supabase } from '../lib/supabaseClient'

const email = ref('')
const password = ref('')

const session = ref(null)
const loading = ref(false)
const error = ref('')
const msg = ref('')

let sub

function clearTips() {
  error.value = ''
  msg.value = ''
}

async function loadSession() {
  const { data, error: e } = await supabase.auth.getSession()
  if (e) {
    error.value = e.message ?? String(e)
    return
  }
  session.value = data.session
}

async function signUp() {
  loading.value = true
  clearTips()
  try {
    const { error: e } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })
    if (e) throw e
    msg.value = '注册请求已提交。若开启邮箱确认，请去邮箱完成确认后再登录。'
  } catch (e) {
    error.value = e.message ?? String(e)
  } finally {
    loading.value = false
  }
}

async function signIn() {
  loading.value = true
  clearTips()
  try {
    const { error: e } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (e) throw e
    msg.value = '登录成功'
  } catch (e) {
    error.value = e.message ?? String(e)
  } finally {
    loading.value = false
  }
}

async function signOut() {
  loading.value = true
  clearTips()
  try {
    const { error: e } = await supabase.auth.signOut()
    if (e) throw e
    msg.value = '已退出登录'
  } catch (e) {
    error.value = e.message ?? String(e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadSession()

  const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession
  })
  sub = data.subscription
})

onUnmounted(() => {
  sub?.unsubscribe()
})
</script>

<style scoped>
.wrap {
  max-width: 560px;
  margin: 40px auto;
  padding: 0 16px;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji",
    "Segoe UI Emoji";
}
.card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
}
.form {
  display: grid;
  gap: 12px;
}
.label {
  display: grid;
  gap: 6px;
  font-size: 14px;
}
.input {
  height: 38px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  padding: 0 12px;
  outline: none;
}
.input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
.actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.btn {
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  cursor: pointer;
}
.btn.primary {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #fff;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.hint {
  margin-top: 12px;
  color: #6b7280;
  font-size: 13px;
}
.msg {
  margin-top: 12px;
  color: #065f46;
  font-size: 13px;
}
.err {
  margin-top: 12px;
  color: #b91c1c;
  font-size: 13px;
}
</style>