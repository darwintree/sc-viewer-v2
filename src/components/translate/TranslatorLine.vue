// TranslatorLine.vue

<template>
  <!-- only render the component if all required props are defined -->
  <div class="line">
    <!-- the avatar is a child component that displays the avatar image -->
    <Avatar :name="'283'" />

    <!-- the "text-container" element contains the name, text, and translation -->
    <div class="text-container">
      <div class="name" v-if="name">{{ name }}
      </div>
      <!-- the "line-controls" element contains the "trans" text and the "edit-toggle" button -->
      <div class="line-controls text">
        <!-- the "trans" element is shown when the component is not in edit mode -->
        <div v-if="!isEditing">{{ display_trans }}</div>
        <n-button class="edit-toggle" strong primary circle type="success" @click="toggleEdit" v-if="!isEditing"
          title="edit">
          <template #icon>
            <n-icon>
              <Edit />
            </n-icon>
          </template>
          <!-- Edit -->
        </n-button>

        <n-button-group class="edit-container" v-else>
          <n-input type="text" v-model:value="edit_trans" class="edit-textarea" placeholder="translator"></n-input>
          <n-button class="edit-cancel" circle secondary @click="cancelEdit">
            <template #icon>
              <n-icon>
                <img src="/public/icon/material/CancelFilled.svg" />
              </n-icon>
            </template>
          </n-button>
          <n-button class="edit-save" circle secondary strong type="success" @click="saveEdit">
            <template #icon>
              <n-icon>
                <img src="/public/icon/material/CheckFilled.svg" />
              </n-icon>
            </template>
          </n-button>
        </n-button-group>
      </div>
    </div>
  </div>
</template>



<script lang="ts">
import { defineComponent } from 'vue';
import { NButton, NIcon, NButtonGroup, NInput } from 'naive-ui'
import Avatar from './Avatar.vue'; // import the "Avatar" component
import { Edit } from '@vicons/carbon'

// define the props for the component
export default defineComponent({
  // define the "Avatar" component as a child component
  components: {
    Avatar,
    NButton,
    NIcon,
    Edit,
    NButtonGroup,
    NInput,
  },
  props: {
    // the name of the speaker
    name: {
      type: String,
      required: true,
    },
    // the text of the message
    trans: {
      type: String,
      required: true,
    },
  },
  data() {
    // define the initial data for the component
    return {
      // define the editing state of the component
      isEditing: false,
      // define the edited translation of the message
      local_trans: "",
      edit_trans: "",
    };
  },
  mounted() {
    this.local_trans = this.trans;
  },
  watch: {
    trans(newValue) {
      this.local_trans = newValue;
    }
  },
  computed: {
    display_trans() {
      if (this.local_trans)
        return this.local_trans.replace("\\n", "\n")
      return ""
    }
  },
  methods: {
    // define the "cancelEdit" method to cancel the edit operation
    cancelEdit() {
      this.isEditing = false;
    },
    // define the "saveEdit" method to save the edited translation
    saveEdit() {
      this.isEditing = false;
      this.local_trans = this.edit_trans;
      this.$emit("save")
    },
    toggleEdit() {
      this.isEditing = true;
      this.edit_trans = this.local_trans;
    },
  },
});
</script>
<style scoped>
/* define the grid layout for the "DialogueLine" component */
.line {
  display: grid;
  grid-template-columns: auto 1fr;
}

/* position the avatar in the first column of the grid */
.line>.avatar {
  grid-column: 1;
}

/* position the text elements in the second column of the grid */
.line>.text-container {
  grid-column: 2;
  text-align: left;
  white-space: pre-wrap;
}

/* add styles for the text elements */
.line>.text-container>.name {
  font-size: 0.8em;
  padding-top: 10px;
}

.line>.text-container>.text {
  padding: 0.5em;
  background-color: #f0f0f0;
  border-radius: 0.25em;
}

.trans {
  font-size: 0.9em;
  color: #999;
  flex: 6;
  padding: 0.5em;
}

.edit-container {
  width: 100%;
}

/* add styles to align the "Edit" button to the right inside the ".line-controls" element */
.line-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 8
}

.select-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 8;
  text-align: center;
}

</style>
