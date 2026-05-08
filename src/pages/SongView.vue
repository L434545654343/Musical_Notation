<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const song = ref(null)

function isUuid(v) {
  return (
    typeof v === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
  )
}

function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

const bvid = computed(() => (song.value?.bv ?? '').trim())
const biliEmbedUrl = computed(() => {
  if (!bvid.value) return ''
  return `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bvid.value)}&page=1`
})
const biliUrl = computed(() => {
  if (!bvid.value) return ''
  return `https://www.bilibili.com/video/${encodeURIComponent(bvid.value)}`
})

async function loadSong() {
  loading.value = true
  error.value = ''
  song.value = null

  try {
    const id = route.params.id

    if (!isUuid(id)) {
      error.value = '这个歌曲 ID 不是合法的 UUID（可能是旧链接）。请从 Home 进入。'
      return
    }

    const { data: sess } = await supabase.auth.getSession()
    const session = sess.session
    if (!session) {
      router.push('/auth')
      return
    }

    const { data, error: e } = await supabase
      .from('songs')
      .select('id,title,bv,tab_text,created_at')
      .eq('id', id)
      .single()

    if (e) throw e
    song.value = data
  } catch (e) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

async function removeSong() {
  if (!song.value?.id) return
  if (!confirm('确定删除这条歌曲吗？')) return

  const { error: e } = await supabase.from('songs').delete().eq('id', song.value.id)
  if (e) {
    alert(e.message)
    return
  }
  router.push('/')
}

async function copyLink() {
  if (!song.value?.id) return
  const url = `${location.origin}/songs/${song.value.id}`
  try {
    await navigator.clipboard.writeText(url)
    alert('已复制链接')
  } catch {
    prompt('复制这个链接：', url)
  }
}

onMounted(loadSong)
</script>

<template>
  <div class="container">
    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
      <h1 style="margin:0;">Song</h1>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button @click="$router.push('/')">返回</button>
        <button @click="copyLink" :disabled="!song?.id">复制链接</button>
        <button class="danger" @click="removeSong" :disabled="!song?.id">删除</button>
      </div>
    </div>

    <div class="hr"></div>

    <div v-if="loading" class="muted">加载中…</div>
    <div v-if="error" style="color:#b91c1c;">{{ error }}</div>

    <div v-if="song" style="display:grid; gap: 14px;">
      <div class="listItem" style="margin:0;">
        <div>
          <div style="font-size:22px; font-weight:800;">{{ song.title }}</div>
          <div class="muted" style="margin-top:6px; font-size:13px;">
            BV：<span class="mono">{{ song.bv }}</span>
            | created: {{ fmtTime(song.created_at) }}
          </div>
          <div class="muted" style="margin-top:6px; font-size:13px;">
            id：<span class="mono">{{ song.id }}</span>
          </div>
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <a
            v-if="biliUrl"
            :href="biliUrl"
            target="_blank"
            rel="noreferrer"
            style="text-decoration:none;"
          >
            <button type="button">原视频</button>
          </a>
        </div>
      </div>

      <div v-if="biliEmbedUrl">
        <iframe
          :src="biliEmbedUrl"
          style="width: 100%; aspect-ratio: 16/9; border: 0; background:#000; border-radius: 12px;"
          allowfullscreen
        />
      </div>

      <div>
        <div style="margin-bottom:8px;">谱子文本</div>
        <pre
          style="white-space: pre-wrap; padding: 12px; background:#fafafa; border:1px solid #eee; border-radius: 10px; margin:0;"
        >{{ song.tab_text }}</pre>
      </div>
    </div>
  </div>
</template>