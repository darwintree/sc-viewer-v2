// TranslatorLine.vue

<template>
  <!-- only render the component if all required props are defined -->
  <div class="line" v-if="trans">
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
        <button class="edit-toggle" @click="toggleEdit" v-if="!isEditing">Edit</button>

        <!-- the "edit-container" element is shown when the component is in edit mode -->
        <div class="edit-container" v-else>
          <textarea v-model="edit_trans" class="edit-textarea"></textarea>

          <!-- the "edit-controls" element contains the "edit-cancel" and "edit-save" buttons -->
          <div class="edit-controls">
            <button class="edit-cancel" @click="cancelEdit">Cancel</button>
            <button class="edit-save" @click="saveEdit">Save</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>



<script lang="ts">
import { defineComponent } from 'vue';
import Avatar from '../Avatar.vue'; // import the "Avatar" component

// define the props for the component
export default defineComponent({
  // define the "Avatar" component as a child component
  components: {
    Avatar,
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

.line>.line-controls>.edit-container>textarea {
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

.edit-container {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.edit-toggle {
  height: 2rem;
  justify-self: stretch;
  /* flex: 2; */
}

/* update the styles for the ".edit-controls" element to display its child elements on the same line */
.edit-controls {
  display: flex;
  align-items: center;
}
</style>
