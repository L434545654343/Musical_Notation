<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div>
    <nav
      style="
        position: sticky;
        top: 0;
        z-index: 10;
        background: white;
        border-bottom: 1px solid #eee;
      "
    >
      <div
        style="
          max-width: 1000px;
          margin: 0 auto;
          padding: 10px 16px;
          display: flex;
          gap: 12px;
          align-items: center;
        "
      >
        <RouterLink to="/" style="text-decoration:none;">Home</RouterLink>
        <RouterLink to="/upload" style="text-decoration:none;">Upload</RouterLink>
        <RouterLink to="/login" style="text-decoration:none;">Login</RouterLink>
      </div>
    </nav>

    <main style="max-width: 1000px; margin: 0 auto;">
      <RouterView />
    </main>
  </div>
</template>