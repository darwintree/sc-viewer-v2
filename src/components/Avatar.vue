<template>
  <!-- the "avatar" element displays the avatar image -->
  <div class="avatar">
    <img :src="avatarUrl" :alt="name" onerror="this.onerror=null;this.src='/icon/dummy.webp'"/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

// define the props for the component
export default defineComponent({
  props: {
    // the name of the speaker, which is used to determine the avatar image
    name: {
      type: String,
      required: true,
    },
  },
  computed: {
    // compute the URL of the avatar image based on the name of the speaker
    avatarUrl() {
      return `/icon/${this.name}.webp`;
    }
  },
});
</script>

<style scoped>
/* add styles for the "Avatar" component here */
img {
  width: 20vw;
  max-width: 120px;
  height: auto;
}

.avatar {
  padding: 10px;
}
</style>