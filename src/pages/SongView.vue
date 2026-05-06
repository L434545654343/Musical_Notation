<script setup>
import { computed, ref, watchEffect, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const songId = computed(() => String(route.params.id ?? ''))

const title = ref('')
const bv = ref('')
const tabText = ref('')
const notFound = ref(false)

const page = ref(1)

const saveStatus = ref('') // '', 'saving', 'saved'
const hydrating = ref(false)

let saveTimer = null

function persist() {
  const id = songId.value.trim()
  if (!id) return
  if (notFound.value) return

  const song = {
    id,
    title: title.value,
    bv: bv.value,
    tabText: tabText.value,
    page: page.value,
    updatedAt: new Date().toISOString(),
  }

  try {
    localStorage.setItem(`song:${id}`, JSON.stringify(song))
    saveStatus.value = 'saved'
  } catch {
    saveStatus.value = ''
  }
}

async function copyTab() {
  const text = String(tabText.value || '')
  if (!text.trim()) {
    alert('Tab 为空，没什么可复制的。')
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    alert('Tab 已复制到剪贴板')
  } catch {
    // 兼容性兜底
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert('Tab 已复制到剪贴板')
  }
}

/** 自动滚动（px/s） */
const autoScrollOn = ref(false)
const scrollSpeed = ref(60)
const tabScrollEl = ref(null)

let rafId = 0
let lastTs = 0

function stopAutoScroll() {
  autoScrollOn.value = false
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
  lastTs = 0
}

function startAutoScroll() {
  if (!tabScrollEl.value) return

  // 开始滚动时退出编辑状态，让 readonly 更“明显”
  document.activeElement?.blur?.()

  autoScrollOn.value = true
  lastTs = 0

  const tick = (ts) => {
    if (!autoScrollOn.value || !tabScrollEl.value) return

    if (!lastTs) lastTs = ts
    const dt = (ts - lastTs) / 1000
    lastTs = ts

    const el = tabScrollEl.value
    const max = el.scrollHeight - el.clientHeight
    const next = Math.min(max, el.scrollTop + scrollSpeed.value * dt)
    el.scrollTop = next

    // 到底自动停
    if (next >= max - 1) {
      stopAutoScroll()
      return
    }

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)
}

function toggleAutoScroll() {
  if (autoScrollOn.value) stopAutoScroll()
  else startAutoScroll()
}

function scrollToTop() {
  if (!tabScrollEl.value) return
  tabScrollEl.value.scrollTop = 0
}

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
})

function deleteSong() {
  const id = songId.value.trim()
  if (!id) return
  if (!confirm('确定删除这首歌吗？删除后无法恢复。')) return

  localStorage.removeItem(`song:${id}`)
  window.location.href = '/'
}

// 读取 localStorage
watchEffect(() => {
  hydrating.value = true
  saveStatus.value = ''
  notFound.value = false

  const id = songId.value.trim()
  if (!id) {
    hydrating.value = false
    return
  }

  const raw = localStorage.getItem(`song:${id}`)
  if (!raw) {
    notFound.value = true
    title.value = ''
    bv.value = ''
    tabText.value = ''
    page.value = 1
    hydrating.value = false
    return
  }

  try {
    const song = JSON.parse(raw)
    title.value = String(song.title ?? '')
    bv.value = String(song.bv ?? '')
    tabText.value = String(song.tabText ?? '')
    page.value = Number(song.page ?? 1) || 1
  } catch {
    notFound.value = true
    title.value = ''
    bv.value = ''
    tabText.value = ''
    page.value = 1
  } finally {
    hydrating.value = false
  }
})

// 防抖保存
watchEffect(() => {
  if (hydrating.value) return
  if (notFound.value) return

  // 触发依赖收集
  title.value
  bv.value
  tabText.value
  page.value

  saveStatus.value = 'saving'
  if (saveTimer) clearTimeout(saveTimer)

  saveTimer = setTimeout(() => {
    persist()
  }, 500)
})

const bvidInputError = computed(() => bv.value.trim() !== '' && !bv.value.trim().startsWith('BV'))

const embedUrl = computed(() => {
  const bvid = bv.value.trim()
  if (!bvid) return ''
  const p = Number(page.value || 1) || 1
  // danmaku=0：尽量关闭弹幕
  return `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bvid)}&page=${encodeURIComponent(
    String(p)
  )}&autoplay=0&danmaku=0`
})
</script>

<template>
  <div style="padding: 16px; display: grid; gap: 12px;">
    <header style="display: grid; gap: 8px;">
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <button
          type="button"
          @click="$router.push('/')"
          style="padding: 6px 10px; border-radius: 8px; border: 1px solid #ccc; background: #fff;"
        >
          ← 返回列表
        </button>

        <h1 style="margin: 0;">
          {{ title || 'Song View' }}
        </h1>

        <button
          type="button"
          @click="deleteSong"
          style="margin-left:auto; padding: 6px 10px; border-radius: 8px; border: 1px solid #b00020; background: #fff; color:#b00020;"
        >
          删除
        </button>
      </div>

      <div style="color: #666;">songId: {{ songId }}</div>
    </header>

    <div
      v-if="notFound"
      style="padding: 12px; border: 1px solid #f3c2c2; background: #fff5f5; border-radius: 8px; color: #7a1f1f; display:grid; gap:10px;"
    >
      <div>
        未找到该歌曲（localStorage 中不存在 <code>song:{{ songId }}</code>）。
        你可以先去 <code>/upload</code> 创建一条。
      </div>

      <button
        type="button"
        @click="$router.push('/upload')"
        style="padding: 10px 12px; border-radius: 8px; border: 1px solid #111; background: #111; color: #fff; width: fit-content;"
      >
        去 Upload 创建
      </button>
    </div>

    <section v-else style="display: grid; gap: 10px;">
      <!-- 视频：最大宽度 720px，保持 16:9 原比例（aspect-ratio）并居中 -->
      <section
        v-if="embedUrl"
        style="display: grid; gap: 8px; max-width: 720px; width: 100%; margin: 0 auto;"
      >
        <h2 style="margin: 0;">视频</h2>
        <iframe
          :src="embedUrl"
          scrolling="no"
          frameborder="0"
          allowfullscreen="true"
          style="width: 100%; aspect-ratio: 16 / 9; border: 1px solid #eee; border-radius: 8px;"
        />
      </section>

      <!-- 基本信息：全宽 -->
      <div
        style="display:grid; gap:10px; grid-template-columns: 1fr 1fr 140px; align-items:end; width: 100%;"
      >
        <label style="display: grid; gap: 6px;">
          <span>标题</span>
          <input
            v-model="title"
            placeholder="歌曲标题"
            style="padding: 8px; border: 1px solid #ccc; border-radius: 6px; width: 100%; box-sizing: border-box;"
          />
        </label>

        <label style="display: grid; gap: 6px;">
          <span>B 站 BV 号</span>
          <input
            v-model="bv"
            placeholder="例如：BV1..."
            style="padding: 8px; border: 1px solid #ccc; border-radius: 6px; width: 100%; box-sizing: border-box;"
          />
        </label>

        <label style="display: grid; gap: 6px;">
          <span>分 P</span>
          <input
            v-model.number="page"
            type="number"
            min="1"
            step="1"
            style="padding: 8px; border: 1px solid #ccc; border-radius: 6px; width: 100%; box-sizing: border-box;"
          />
        </label>
      </div>

      <p v-if="bvidInputError" style="margin: 0; color: #b00020;">
        看起来不像 BV 号（应以 “BV” 开头）。
      </p>

      <!-- 谱子：全宽 + 更大的可视高度 -->
      <div style="display: grid; gap: 6px; width: 100%;">
        <div
          style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;"
        >
          <span>Tab（谱子文本）</span>

          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <label style="display:flex; align-items:center; gap:6px; color:#666; font-size:12px;">
              速度(px/s)
              <input
                v-model.number="scrollSpeed"
                type="number"
                min="5"
                max="600"
                step="5"
                style="width: 92px; padding: 6px 8px; border-radius: 8px; border: 1px solid #ccc;"
              />
            </label>

            <button
              type="button"
              @click="toggleAutoScroll"
              style="padding: 6px 10px; border-radius: 8px; border: 1px solid #111; background: #111; color:#fff;"
            >
              {{ autoScrollOn ? '暂停滚动' : '开始滚动' }}
            </button>

            <button
              type="button"
              @click="scrollToTop"
              style="padding: 6px 10px; border-radius: 8px; border: 1px solid #ccc; background: #fff;"
            >
              回到顶部
            </button>

            <button
              type="button"
              @click="copyTab"
              style="padding: 6px 10px; border-radius: 8px; border: 1px solid #ccc; background: #fff;"
            >
              复制 Tab
            </button>
          </div>
        </div>

        <div
          ref="tabScrollEl"
          style="max-height: 520px; overflow:auto; padding: 8px; border: 1px solid #ccc; border-radius: 6px; background:#fff; width: 100%; box-sizing: border-box;"
        >
          <textarea
            v-model="tabText"
            placeholder="在这里粘贴/编辑谱子…"
            rows="14"
            :readonly="autoScrollOn"
            :style="{
              width: '100%',
              minHeight: '900px',
              border: 0,
              outline: 'none',
              resize: 'vertical',
              padding: 0,
              boxSizing: 'border-box',
              fontFamily:
                `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`,
              background: autoScrollOn ? '#fafafa' : '#fff',
              cursor: autoScrollOn ? 'not-allowed' : 'text',
            }"
          />
        </div>
      </div>

      <div style="color: #666;">
        <span v-if="saveStatus === 'saving'">正在保存…</span>
        <span v-else-if="saveStatus === 'saved'">已保存</span>
      </div>
    </section>
  </div>
</template>