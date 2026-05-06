<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const refreshToken = ref(0)
const query = ref('')

const importError = ref('')
const importOk = ref('')

function readAllSongs() {
  const items = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith('song:')) continue

    const raw = localStorage.getItem(key)
    if (!raw) continue

    try {
      const song = JSON.parse(raw)
      items.push(song)
    } catch {
      // ignore bad entries
    }
  }
  return items
}

function toListItem(song) {
  return {
    id: String(song.id ?? ''),
    title: String(song.title ?? '(untitled)'),
    bv: String(song.bv ?? ''),
    createdAt: String(song.createdAt ?? ''),
    updatedAt: String(song.updatedAt ?? ''),
  }
}

function normalizeSong(input) {
  const now = new Date().toISOString()

  const id = String(input?.id ?? '').trim()
  const title = String(input?.title ?? '').trim()
  const bv = String(input?.bv ?? '').trim()
  const tabText = String(input?.tabText ?? '')

  const page = Math.max(1, Number(input?.page ?? 1) || 1)

  const createdAt = String(input?.createdAt ?? '').trim() || now
  const updatedAt = String(input?.updatedAt ?? '').trim() || createdAt

  return {
    id,
    title,
    bv,
    page,
    tabText,
    createdAt,
    updatedAt,
  }
}

function loadSongsForList() {
  const songs = readAllSongs().map(toListItem)
  songs.sort((a, b) =>
    (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')
  )
  return songs
}

const songs = computed(() => {
  refreshToken.value
  return loadSongsForList()
})

const filteredSongs = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return songs.value

  return songs.value.filter((s) => {
    return (
      String(s.title || '').toLowerCase().includes(q) ||
      String(s.bv || '').toLowerCase().includes(q) ||
      String(s.id || '').toLowerCase().includes(q)
    )
  })
})

function go(id) {
  router.push(`/songs/${id}`)
}

function removeSong(id) {
  if (!confirm('确定删除这首歌吗？')) return
  localStorage.removeItem(`song:${id}`)
  refreshToken.value++
}

function removeAllSongs() {
  const total = songs.value.length
  if (total === 0) {
    alert('当前没有歌曲可删除。')
    return
  }

  if (!confirm(`确定删除全部 ${total} 首歌吗？此操作不可恢复。`)) return
  if (!confirm('再次确认：真的要清空全部歌曲吗？')) return

  const keysToDelete = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('song:')) keysToDelete.push(key)
  }

  for (const k of keysToDelete) localStorage.removeItem(k)

  refreshToken.value++
  query.value = ''
  alert('已删除全部歌曲。')
}

async function copyLink(id) {
  const url = `${window.location.origin}/songs/${id}`
  try {
    await navigator.clipboard.writeText(url)
    alert('已复制链接：' + url)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = url
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert('已复制链接：' + url)
  }
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportJson() {
  importError.value = ''
  importOk.value = ''

  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    songs: readAllSongs(),
  }

  const filename = `tab-player-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  download(filename, JSON.stringify(data, null, 2))
}

async function onImportChange(e) {
  importError.value = ''
  importOk.value = ''

  const file = e.target.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)

    const arr = Array.isArray(data?.songs) ? data.songs : null
    if (!arr) throw new Error('文件格式不对：缺少 songs 数组')

    let count = 0
    for (const s of arr) {
      const normalized = normalizeSong(s)
      if (!normalized.id) continue
      localStorage.setItem(`song:${normalized.id}`, JSON.stringify(normalized))
      count++
    }

    refreshToken.value++
    importOk.value = `导入成功：${count} 条`
  } catch (err) {
    importError.value = `导入失败：${err?.message ?? String(err)}`
  } finally {
    e.target.value = ''
  }
}
</script>

<template>
  <div style="padding: 16px; display: grid; gap: 12px; max-width: 900px;">
    <header class="toolbar">
      <h1 style="margin: 0;">Songs</h1>

      <button type="button" class="btn" @click="refreshToken++">刷新</button>

      <button type="button" class="btn btn-primary" @click="router.push('/upload')">
        新建（Upload）
      </button>

      <input v-model="query" class="control" placeholder="搜索：标题 / BV / id" />

      <button type="button" class="btn" @click="exportJson">导出 JSON</button>

      <label class="btn btn-label">
        导入 JSON
        <input type="file" accept="application/json" style="display:none" @change="onImportChange" />
      </label>

      <button type="button" class="btn btn-danger" @click="removeAllSongs">删除全部</button>
    </header>

    <p v-if="importOk" style="margin: 0; color: #0a7a2f;">{{ importOk }}</p>
    <p v-if="importError" style="margin: 0; color: #b00020;">{{ importError }}</p>

    <div v-if="songs.length === 0" style="color: #666;">
      还没有歌曲。点击“新建（去 Upload）”创建第一条。
    </div>

    <div v-else-if="filteredSongs.length === 0" style="color:#666;">
      没有匹配的结果。
    </div>

    <div v-else style="display: grid; gap: 8px;">
      <div
        v-for="s in filteredSongs"
        :key="s.id"
        style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding: 10px 12px; border: 1px solid #eee; border-radius: 10px;"
      >
        <div style="display:grid; gap:4px;">
          <strong>{{ s.title }}</strong>

          <small style="color:#666;">
            id: {{ s.id }}
            <span v-if="s.bv">| {{ s.bv }}</span>
            <span v-if="s.updatedAt || s.createdAt">
              | {{ s.updatedAt ? `updated: ${s.updatedAt}` : `created: ${s.createdAt}` }}
            </span>
          </small>
        </div>

        <div style="display:flex; gap:8px;">
          <button type="button" class="btn btn-primary" @click="go(s.id)">打开</button>
          <button type="button" class="btn" @click="copyLink(s.id)">复制链接</button>
          <button type="button" class="btn" @click="removeSong(s.id)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 顶部工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* 统一按钮/输入框的“高度、字体、line-height”，避免视觉不一致 */
.btn,
.control {
  box-sizing: border-box;
  height: 36px;

  font-size: 14px;
  line-height: 1;
  font-family: inherit;
  font-weight: 500;
}

/* 按钮统一用 inline-flex，确保文字垂直居中 */
.btn {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
  background: #fff;
  color: inherit;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  white-space: nowrap;
  cursor: pointer;
}

/* label 伪装成按钮时也要一致 */
.btn-label {
  user-select: none;
}

/* 主按钮 */
.btn-primary {
  border-color: #111;
  background: #111;
  color: #fff;
}

/* 危险按钮 */
.btn-danger {
  border-color: #b00020;
  color: #b00020;
}

/* 输入框 */
.control {
  min-width: 240px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
  background: #fff;
}
</style>