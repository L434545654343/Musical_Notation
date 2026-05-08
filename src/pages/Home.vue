<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'

const router = useRouter()

const loading = ref(false)
const error = ref('')
const songs = ref([])
const q = ref('')

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return songs.value
  return songs.value.filter((x) =>
    `${x.title ?? ''} ${x.bv ?? ''} ${x.id ?? ''}`.toLowerCase().includes(s)
  )
})

function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

async function loadSongs() {
  loading.value = true
  error.value = ''
  try {
    const { data: sess } = await supabase.auth.getSession()
    const session = sess.session
    if (!session) {
      songs.value = []
      return
    }

    const { data, error: e } = await supabase
      .from('songs')
      .select('id,title,bv,created_at')
      .order('created_at', { ascending: false })

    if (e) throw e
    songs.value = data ?? []
  } catch (e) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

function openSong(id) {
  router.push(`/songs/${id}`)
}

async function removeSong(id) {
  if (!confirm('确定删除这条歌曲吗？')) return
  const { error: e } = await supabase.from('songs').delete().eq('id', id)
  if (e) {
    alert(e.message)
    return
  }
  await loadSongs()
}

async function copyLink(id) {
  const url = `${location.origin}/songs/${id}`
  try {
    await navigator.clipboard.writeText(url)
    alert('已复制链接')
  } catch {
    prompt('复制这个链接：', url)
  }
}

onMounted(loadSongs)
</script>

<template>
  <div class="container">
    <div class="bigTitle">Songs</div>

    <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
      <button @click="loadSongs" :disabled="loading">刷新</button>
      <button class="primary" @click="$router.push('/upload')">新建（去 Upload）</button>
      <input v-model="q" placeholder="搜索：标题 / BV / id" style="width: 340px;" />
    </div>

    <div class="hr"></div>

    <div v-if="loading" class="muted">加载中…</div>
    <div v-if="error" style="color:#b91c1c;">{{ error }}</div>

    <div v-if="!loading && !error && filtered.length === 0" class="muted">
      没有数据（或未登录）。去 Upload 新建一条。
    </div>

    <div v-for="s in filtered" :key="s.id" class="listItem">
      <div style="min-width:0;">
        <div style="font-size:20px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          {{ s.title }}
        </div>
        <div class="muted" style="margin-top:6px; font-size:13px;">
          id: <span class="mono">{{ s.id }}</span>
          | <span class="mono">{{ s.bv }}</span>
          | created: {{ fmtTime(s.created_at) }}
        </div>
      </div>

      <div style="display:flex; gap:10px; align-items:center;">
        <button class="primary" @click="openSong(s.id)">打开</button>
        <button @click="copyLink(s.id)">复制链接</button>
        <button class="danger" @click="removeSong(s.id)">删除</button>
      </div>
    </div>
  </div>
</template>