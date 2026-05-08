<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'

const router = useRouter()

const title = ref('')
const bv = ref('')
const tabText = ref('')

const loading = ref(false)
const error = ref('')

async function save() {
  error.value = ''

  const t = title.value.trim()
  const b = bv.value.trim()

  if (!t) return alert('请填写标题')
  if (!b) return alert('请填写 BV')

  loading.value = true
  try {
    const { data: sess } = await supabase.auth.getSession()
    const session = sess.session
    if (!session) {
      router.push('/auth')
      return
    }

    const { data, error: e } = await supabase
      .from('songs')
      .insert({
        user_id: session.user.id,
        title: t,
        bv: b,
        tab_text: tabText.value ?? '',
      })
      .select('id')
      .single()

    if (e) throw e
    router.push(`/songs/${data.id}`)
  } catch (e) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container">
    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
      <h1 style="margin:0;">Upload</h1>
      <button @click="$router.push('/')">返回</button>
    </div>

    <div class="hr"></div>

    <div style="display:grid; gap:12px; max-width: 720px;">
      <div>
        <div style="margin-bottom:6px;">标题</div>
        <input v-model="title" placeholder="标题" style="width: 100%;" />
      </div>

      <div>
        <div style="margin-bottom:6px;">BV</div>
        <input v-model="bv" placeholder="BV1..." style="width: 100%;" />
      </div>

      <div>
        <div style="margin-bottom:6px;">谱子文本（可空）</div>
        <textarea
          v-model="tabText"
          rows="10"
          placeholder="粘贴谱子文本…"
          style="width: 100%; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;"
        />
      </div>

      <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <button class="primary" :disabled="loading" @click="save">
          {{ loading ? '保存中…' : '保存' }}
        </button>
        <span v-if="error" style="color:#b91c1c;">{{ error }}</span>
      </div>
    </div>
  </div>
</template>