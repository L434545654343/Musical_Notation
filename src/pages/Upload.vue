<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const title = ref('')
const bv = ref('')
const tabText = ref('')

function generateId() {
  // 简单可用的 id：时间戳 + 随机数
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function saveSong() {
  const t = title.value.trim()
  const b = bv.value.trim()
  const tab = tabText.value

  if (!t) {
    alert('请填写标题')
    return
  }
  if (!b) {
    alert('请填写 BV 号')
    return
  }

  const id = generateId()

  const song = {
    id,
    title: t,
    bv: b,
    tabText: tab,
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem(`song:${id}`, JSON.stringify(song))
  router.push('/')
}
</script>

<template>
  <div style="padding: 16px; display: grid; gap: 12px; max-width: 720px;">
    <h1 style="margin: 0;">Upload</h1>

    <label style="display: grid; gap: 6px;">
      <span>标题</span>
      <input
        v-model="title"
        placeholder="例如：Hotel California"
        style="padding: 8px; border: 1px solid #ccc; border-radius: 6px;"
      />
    </label>

    <label style="display: grid; gap: 6px;">
      <span>B 站 BV 号</span>
      <input
        v-model="bv"
        placeholder="例如：BV1..."
        style="padding: 8px; border: 1px solid #ccc; border-radius: 6px;"
      />
    </label>

    <label style="display: grid; gap: 6px;">
      <span>曲谱文本</span>
      <textarea
        v-model="tabText"
        rows="10"
        placeholder="粘贴曲谱文本（可为空）"
        style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;"
      />
    </label>

    <button
      type="button"
      @click="saveSong"
      style="padding: 10px 12px; border-radius: 8px; border: 1px solid #111; background: #111; color: #fff; width: fit-content;"
    >
      保存并进入播放页
    </button>

    <p style="margin: 0; color: #666;">
      说明：当前保存到 localStorage（后续再接后端）。
    </p>
  </div>
</template>