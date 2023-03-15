// Communication.vue

<template>
  <div class="container">
    <div v-if="isLoading" class="loading">
      <n-spin size="large"></n-spin>
    </div>
    <IndexModal
      :show-modal="showIndexModal"
      @close="
        () => {
          showIndexModal = false
        }
      "
      @change-chapter="changeChapter"
    >
    </IndexModal>
    <!-- the "communication" element contains the list of messages -->
    <div v-if="!!data.length" class="jump">
      <n-button-group>
        <n-button
          v-if="firstJsonUrl"
          strong
          round
          type="warning"
          @click="changeChapter(firstJsonUrl)"
        >
          ← {{ $t('control.first') }}
        </n-button>
        <n-button
          v-else
          strong
          round
          type="info"
          :disabled="!previousJsonUrl"
          @click="changeChapter(previousJsonUrl)"
        >
          ← {{ $t('control.previous') }}
        </n-button>

        <n-button
          strong
          bordered
          type="default"
          :disabled="!eventsCollectionMeta"
          @click="showIndexModal = true"
        >
          <template #icon>
            <n-icon>
              <Document />
            </n-icon>
          </template>
          {{ $t('control.index') }}
        </n-button>
        <n-button strong bordered class="preview-button" @click="previewStory"
          >{{ $t('control.review') }}⤵</n-button
        >

        <n-button
          v-if="nextJsonUrl || !trueEndJsonUrl"
          strong
          round
          type="info"
          :disabled="!nextJsonUrl"
          @click="changeChapter(nextJsonUrl)"
          >{{ $t('control.next') }} →</n-button
        >
        <n-button
          v-else
          strong
          round
          type="primary"
          @click="changeChapter(trueEndJsonUrl)"
          >True End →</n-button
        >
      </n-button-group>
    </div>
    <div class="event-block">
      <!-- <n-button-group>
        <n-button @click="openEvent" tertiary strong bordered round class="preview-button">{{ $t("control.review") }}
          <n-icon>
            <Launch />
          </n-icon>
        </n-button>
          <n-button @click="previewStory" tertiary strong bordered round class="preview-button">{{ $t("control.review") }}⤵</n-button>
        </n-button-group> -->
      <EventIframe v-if="isPreviewing" ref="eventIframe"></EventIframe>
    </div>

    <div
      v-if="!!data.length"
      class="communication"
      :class="{ scroll: hasPreviewed }"
    >
      <!-- use the "v-for" directive to loop over the "data" array and render a "DialogueLine" component for each item -->
      <DialogueLine
        v-for="(item, index) in data"
        :id="item.id"
        :key="index"
        ref="lines"
        :index="index"
        :name="item.name"
        :text="item.text"
        :trans="item.trans"
        :base="jsonUrl.split('.')[0]"
        @save="saveCsvToLocalstorage"
      />
      <TranslatorLine
        ref="translator"
        :name="'译者'"
        :trans="translator"
        @save="saveCsvToLocalstorage"
      />
      <!-- placeholder for toolbar TODO: CSS change -->
      <div class="placeHolderLine"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { NButton, NSpin, NButtonGroup, NIcon, useMessage } from 'naive-ui'
import { Document } from '@vicons/carbon'

import DialogueLine from './DialogueLine.vue' // import the "DialogueLine" component
import FileSaver from 'file-saver'
import EventIframe from './EventIframe.vue'
import TranslatorLine from './TranslatorLine.vue'
import IndexModal from './modal/IndexModal.vue'

import { store, DataSourceType } from '../../store'
import {
  extractInfoFromUrl,
  nextJsonUrl,
  trueEndJsonUrl,
  previousJsonUrl,
  firstJsonUrl,
  queryTranslatedCsv,
  queryRelated,
  metaInfoFromJsonPathUrl,
  metaInfoFromGithubCsvUrl,
  jsonTextFromPathUrl,
} from '../../helper/path'
import {
  CsvDataLine,
  extractInfoFromCsvText,
  toCsvText,
  jsonTextToCsvText,
} from '../../helper/csv'

export default defineComponent({
  // define the "DialogueLine" component as a child component
  components: {
    DialogueLine,
    EventIframe,
    TranslatorLine,
    NButton,
    NSpin,
    NButtonGroup,
    NIcon,
    Document,
    IndexModal,
  },
  setup() {
    const message = useMessage()
    return {
      createSuccessMessage(content: string) {
        message.success(content)
      },
      createWarningMessage(content: string) {
        message.warning(content)
      },
    }
  },
  data() {
    return {
      // store the parsed CSV data in a local variable
      data: [] as CsvDataLine[],
      // jsonUrl: "", // e.g. produce_events/xxx.json
      previousJsonUrl: null as null | string,
      nextJsonUrl: null as null | string,
      trueEndJsonUrl: null as null | string,
      firstJsonUrl: null as null | string,
      translator: '',
      isLoading: false,
      isPreviewing: false,
      // csvFilename: "", // the csv file name after download
      // TODO: a extended csv path to help present the file
      // extendedCsvPath: "",
      hasPreviewed: false,
      showIndexModal: false,
    }
  },
  computed: {
    jsonUrl: {
      get() {
        return store.jsonUrl
      },
      set(newVal: string) {
        store.jsonUrl = newVal
      },
    },
    translatedCsvUrl() {
      return queryTranslatedCsv(this.jsonUrl)
    },
    eventsCollectionMeta() {
      return store.eventsCollectionMeta
    },
  },
  watch: {
    translatedCsvUrl(newVal) {
      if (newVal && store.currentMode === DataSourceType.Raw) {
        this.createSuccessMessage(
          this.$t('translate.remoteTranslationDetected')
        )
      }
    },
  },
  methods: {
    changeChapter(jsonUrl: string | null) {
      if (!jsonUrl) return
      this.$emit('load-data', jsonUrl)
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      })
    },
    async previewStory() {
      this.isPreviewing = !this.isPreviewing
      this.hasPreviewed = true
      if (!this.isPreviewing) return
      const text = await jsonTextFromPathUrl(this.jsonUrl)
      const eventIframe = this.$refs.eventIframe as InstanceType<
        typeof EventIframe
      >
      eventIframe.postMessageOnPlayer({
        iframeJson: JSON.parse(text),
        csvText: this.getCurrentDataString(),
      })
    },
    // openEvent() {
    //   window.open(this.iframeSrc!)
    // },
    loadDataFromLocalStorage(jsonUrl: string) {
      this.isLoading = true
      const text = store.saves.saveDict[jsonUrl].csv
      store.csvFilename = store.saves.saveDict[jsonUrl].name || jsonUrl
      store.path = `data/story///${jsonUrl}`
      this.loadDataFromCsvText(text)
    },
    async loadDataFromGithubCsvUrl(url: string) {
      this.isLoading = true
      const { name, text } = await metaInfoFromGithubCsvUrl(url)
      store.csvFilename = name
      await this.loadDataFromCsvText(text)

      // TODO
      const info = extractInfoFromUrl(url)
      store.owner = info.owner
      store.repo = info.repo
      store.path = decodeURIComponent(info.path)
    },
    async loadDataFromJsonPathUrl(url: string) {
      this.isLoading = true
      const { name, text } = await metaInfoFromJsonPathUrl(url)
      store.csvFilename = name
      this.createWarningMessage(this.$t('translate.loadRawWarning'))
      await this.loadDataFromCsvText(text)
    },
    async loadDataFromFile(file: File) {
      let text = await file.text()
      store.csvFilename = file.name
      if (file.name.endsWith('.json')) {
        store.csvFilename = file.name.replace('.json', '.csv')
        text = jsonTextToCsvText(JSON.parse(text), null)
      }

      store.path = `data/story///${file.name}`
      await this.loadDataFromCsvText(text)
    },
    loadDataFromCsvText(text: string) {
      try {
        const { data, translator, jsonUrl } = extractInfoFromCsvText(text)
        this.jsonUrl = jsonUrl
        this.updateRelatedChapterStatus()
        this.translator = translator
        this.data = data
        this.isLoading = false
      } catch (e) {
        alert(e)
      }
    },
    getCurrentDataString() {
      // generate the updated CSV data by mapping over the "data" array and
      // using the "local_trans" property of each item
      const lines = this.$refs.lines as InstanceType<typeof DialogueLine>[]
      const updatedData = this.data.map((item, index) => {
        return {
          ...item,
          trans: lines[index].local_trans,
        }
      })

      const translatorLine = this.$refs.translator as InstanceType<
        typeof TranslatorLine
      >

      return toCsvText({
        data: updatedData,
        translator: translatorLine.local_trans,
        jsonUrl: this.jsonUrl,
      })
    },
    downloadData() {
      const csv = this.getCurrentDataString()

      // create a new Blob object with the CSV string as its content
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })

      // use the FileSaver library to save the Blob object as a file
      FileSaver.saveAs(blob, store.csvFilename)
    },
    b64EncodeUnicode(str: string) {
      // first we use encodeURIComponent to get percent-encoded UTF-8,
      // then we convert the percent encodings into raw bytes which
      // can be fed into btoa.
      return btoa(
        encodeURIComponent(str).replace(
          /%([0-9A-F]{2})/g,
          function toSolidBytes(match, p1) {
            return String.fromCharCode(Number('0x' + p1))
          }
        )
      )
    },
    saveCsvToLocalstorage() {
      console.log('saving')
      const csv = this.getCurrentDataString()
      store.base64content = this.b64EncodeUnicode(csv)
      store.saves.setItem(this.jsonUrl, {
        csv,
        timeLabel: new Date().toLocaleString(),
        name: store.csvFilename,
      })
      this.createSuccessMessage(this.$t('translate.saveSuccess'))
    },
    async updateRelatedChapterStatus() {
      store.eventsCollectionMeta = await queryRelated(this.jsonUrl)
      // TODO: use eventsCollectionMeta for chapter navigation
      this.nextJsonUrl = await nextJsonUrl(this.jsonUrl)
      this.previousJsonUrl = await previousJsonUrl(this.jsonUrl)
      this.trueEndJsonUrl = await trueEndJsonUrl(this.jsonUrl)
      this.firstJsonUrl = await firstJsonUrl(this.jsonUrl)
    },
  },
})
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.event-block {
  /* display: block; */
  width: 100%;
}

.jump {
  justify-content: center;
  display: flex;
  width: 100%;
  padding: 10px 0 10px 0;
}

.placeHolderLine {
  height: 50px;
}

/* add styles for the "Communication" component here */
.loading {
  font-size: 1.5em;
  font-weight: bold;
  color: red;
}

.ready-button {
  position: fixed;
  top: 60px;
  right: 10px;
  opacity: 0.5;
}

.communication {
  width: 100%;
  max-width: 720px;
  height: 80vh;
}

.scroll {
  overflow: scroll;
}

.communication::-webkit-scrollbar {
  /*滚动条整体样式*/
  width: 10px;
  /*高宽分别对应横竖滚动条的尺寸*/
  height: 1px;
}

.communication::-webkit-scrollbar-thumb {
  /*滚动条里面小方块*/
  border-radius: 10px;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  background: #535353;
}

.communication::-webkit-scrollbar-track {
  /*滚动条里面轨道*/
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  background: #ededed;
}
</style>
