// DialogueLine.vue

<template>
  <!-- only render the component if all required props are defined -->
  <div v-if="text" class="line">
    <!-- the avatar is a child component that displays the avatar image -->
    <Avatar :name="name" />

    <!-- the "text-container" element contains the name, text, and translation -->
    <div class="text-container">
      <div v-if="name" class="name">
        {{ name }}
        <AudioLabel :id="id" :base="base"></AudioLabel>
      </div>
      <div
        :class="{ text: !isSelect, select: isSelect }"
        :style="selectBgStyle"
      >
        {{ display_text }}
      </div>

      <!-- the "line-controls" element contains the "trans" text and the "edit-toggle" button -->
      <div :class="{ 'line-controls': !isSelect, 'select-controls': isSelect }">
        <!-- the "trans" element is shown when the component is not in edit mode -->
        <div v-if="!isEditing" class="trans">{{ display_trans }}</div>
        <n-button
          v-if="!isEditing"
          class="edit-toggle"
          strong
          primary
          circle
          type="success"
          title="edit"
          @click="toggleEdit"
        >
          <template #icon>
            <n-icon>
              <Edit />
            </n-icon>
          </template>
        </n-button>
        <n-button
          v-if="supportsShare"
          class="edit-toggle"
          strong
          primary
          circle
          title="share"
          @click="share"
        >
          <template #icon>
            <n-icon>
              <Share />
            </n-icon>
          </template>
        </n-button>

        <!-- the "edit-container" element is shown when the component is in edit mode -->
        <div
          v-else
          class="edit-container"
          @keydown.shift.enter="trySaveEdit"
          @keydown.esc="cancelEdit"
        >
          <n-input
            ref="edit"
            v-model:value="edit_trans"
            type="textarea"
            class="edit-textarea"
            :placeholder="$t('translate.translatePlaceholder')"
          />

          <!-- the "edit-controls" element contains the "edit-cancel" and "edit-save" buttons -->
          <div class="edit-controls">
            <n-button-group>
              <n-button
                class="edit-cancel"
                type="warning"
                @click="cancelEdit"
                >{{ $t('common.cancel') }}</n-button
              >
              <n-button
                class="edit-save"
                secondary
                strong
                type="success"
                @click="trySaveEdit"
                >{{ $t('common.save') }}</n-button
              >
            </n-button-group>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue'
import Avatar from './DialogueAvatar.vue' // import the "Avatar" component
import AudioLabel from './AudioLabel.vue'
import {
  NButton,
  NIcon,
  NButtonGroup,
  NInput,
  useDialog,
  DialogOptions,
  useNotification,
  NotificationOptions,
} from 'naive-ui'
import { Edit, Share } from '@vicons/carbon'
import { store } from '../../store'
import { DataSource, DataMode } from '../../helper/enum-interfaces'
import { inject } from '@vercel/analytics'

// define the props for the component
export default defineComponent({
  // define the "Avatar" component as a child component
  components: {
    Avatar,
    AudioLabel,
    NButton,
    NIcon,
    Edit,
    NButtonGroup,
    NInput,
    Share,
  },
  props: {
    index: {
      type: Number,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    // the name of the speaker
    name: {
      type: String,
      required: true,
    },
    // the text of the message
    text: {
      type: String,
      required: true,
    },
    // the translation of the message
    trans: {
      type: String,
      required: true,
    },
    base: {
      type: String,
      required: true,
    },
  },
  setup() {
    const dialog = useDialog()
    const notification = useNotification()
    return {
      createWarningDialog(options: DialogOptions) {
        dialog.warning(options)
      },
      createErrorNotification(options: NotificationOptions) {
        notification.error(options)
      },
    }
  },
  data() {
    // define the initial data for the component
    return {
      // define the editing state of the component
      isEditing: false,
      // define the edited translation of the message
      local_trans: '',
      edit_trans: '',
      supportsShare: !!navigator.share,
    }
  },
  computed: {
    display_text() {
      if (this.text) return this.text.replaceAll('\\n', '\n')
      return ''
    },
    display_trans() {
      if (this.local_trans) return this.local_trans.replaceAll('\\n', '\n')
      return ''
    },
    isSelect() {
      return this.id === 'select'
    },
    selectBgStyle() {
      if (this.id === 'select') {
        return {
          'background-image': `url("/select_frame/00${
            (this.index % 5) + 1
          }.png")`,
        }
      }
      return {}
    },
  },
  watch: {
    trans(newValue) {
      this.local_trans = newValue
    },
    edit_trans(newVal) {
      nextTick(() => (this.edit_trans = newVal.replaceAll('\n', '\\n')))
    },
  },
  mounted() {
    this.local_trans = this.trans
  },
  methods: {
    // define the "cancelEdit" method to cancel the edit operation
    cancelEdit() {
      this.isEditing = false
    },
    changeToHistoryMode() {
      store.currentMode = DataMode.History
      this.$router.replace({
        path: this.$route.path,
        hash: `#${this.base}.json`, // for file mode
        query: {
          source: DataSource.Browser,
        },
      })
    },
    // define the "saveEdit" method to save the edited translation
    trySaveEdit() {
      // 3 cases, action besides save
      // if not in histroy mode and has history, overwrite warning and change mode
      // if not in histroy mode but no history, change mode
      // if in history mode, do nothing
      if (store.currentMode === 'history') {
        this.saveEdit()
        return
      }

      const saveId = `${this.base}.json`
      if (store.saves.getItem(saveId)) {
        this.createWarningDialog({
          title: this.$t('translate.overwriteWarning'),
          content: this.$t('translate.overwriteDetails'),
          positiveText: this.$t('common.confirm'),
          negativeText: this.$t('common.cancel'),
          autoFocus: false,
          onPositiveClick: () => {
            this.saveEdit()
            this.changeToHistoryMode()
          },
        })
      } else {
        this.saveEdit()
        this.changeToHistoryMode()
      }
    },
    saveEdit() {
      this.isEditing = false
      this.local_trans = this.edit_trans
      this.$emit('save')
      inject({
        beforeSend: (event) => {
          event.url = event.url.replace('/translate', '/save')
          return event
        },
      })
    },
    toggleEdit() {
      this.isEditing = true
      this.edit_trans = this.local_trans
      this.$nextTick(() => {
        ;(this.$refs.edit as any).focus()
      })
    },
    async share() {
      let url = ''
      if (store.currentMode === 'raw' || store.currentMode === 'server') {
        url = location.href
      } else {
        if (!store.jsonUrl) {
          this.createErrorNotification({
            content:
              'cannot share this page because this is a local page and cannot resolve page source',
            duration: 3000,
          })
        }
        if (store.jsonUrl) {
          url = `${location.origin}/translate#${store.jsonUrl}`
        }
      }
      const text = `${this.name}: "${
        this.local_trans ? this.local_trans : this.text
      }"`
      const data = {
        url,
        text: text.replace('\\n', '\n'),
        title: store.csvFilename ? store.csvFilename : undefined,
      }
      try {
        await navigator.share(data)
      } catch (e: any) {
        this.createErrorNotification({
          content: e.message,
          duration: 3000,
        })
      }
    },
  },
})
</script>
<style scoped>
/* define the grid layout for the "DialogueLine" component */
.line {
  display: grid;
  grid-template-columns: auto 1fr;
}

/* position the avatar in the first column of the grid */
.line > .avatar {
  grid-column: 1;
}

/* position the text elements in the second column of the grid */
.line > .text-container {
  grid-column: 2;
  text-align: left;
  white-space: pre-wrap;
}

/* add styles for the text elements */
.line > .text-container > .name {
  font-size: 0.8em;
  padding-top: 10px;
}

.line > .text-container > .text {
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

/* .line>.line-controls>.edit-container>textarea {
  width: 100%;
} */

/* add styles to align the "Edit" button to the right inside the ".line-controls" element */
.line-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 8;
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
  margin: 3px;
}

/* update the styles for the ".edit-controls" element to display its child elements on the same line */
.edit-controls {
  display: flex;
  align-items: center;
  justify-content: end;
  margin: 2px 0 0 0;
}

.select {
  /* background-image: url("/select_frame/001.png"); */
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  margin: 1rem 0rem;
  padding: 3rem 2rem;
  text-align: center;
}
</style>
