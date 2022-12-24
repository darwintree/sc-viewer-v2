<template>

</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { getQueryVariable } from '../helper/path';
import { fetchAccessToken } from '../helper/auth';

onMounted(async () => {
  const state = getQueryVariable("state")
  if (state !== localStorage.getItem("state")) {
    window.alert("Unexpected authentication result")
    throw new Error(`state not match: sent ${localStorage.getItem("state")} but received ${state}`)
  }
  const code = getQueryVariable("code")
  if (code === undefined) {
    alert("Authentication failed: no code received")
    throw new Error(`no code received: ${window.location.search} `)
  }
  let accessToken = await fetchAccessToken(code)
  localStorage.removeItem("state")
  localStorage.setItem("accessToken", accessToken)
  window.close()
})
</script>
