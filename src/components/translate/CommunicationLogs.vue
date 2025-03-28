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
          >TE →</n-button
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
import { defineComponent, nextTick, h } from 'vue'
import { NButton, NSpin, NButtonGroup, NIcon, useNotification } from 'naive-ui'
import { Document } from '@vicons/carbon'

import DialogueLine from './DialogueLine.vue' // import the "DialogueLine" component
import FileSaver from 'file-saver'
import EventIframe from './EventIframe.vue'
import TranslatorLine from './TranslatorLine.vue'
import IndexModal from './modal/IndexModal.vue'

import { store } from '../../store'
import { DataMode, DataSource } from '../../helper/enum-interfaces'
import {
  nextJsonUrl,
  trueEndJsonUrl,
  previousJsonUrl,
  firstJsonUrl,
  queryTranslatedCsv,
  queryPreTranslatedCsv,
  jsonTextFromPathUrl,
  searchIndexData,
  getIndexData,
} from '../../helper/path'
import { CsvDataLine, toCsvText } from '../../helper/csv'
import { processSourceInput } from '../../helper/source'

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
    const notification = useNotification()
    return {
      getNotification() {
        return notification
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
      translatedCsvUrl: null as null | string,
      pretranslatedCsvUrl: null as null | string,
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
    eventsCollectionMeta() {
      return store.eventsCollectionMeta
    },
  },
  watch: {
    async jsonUrl(newVal) {
      this.translatedCsvUrl = null
      this.pretranslatedCsvUrl = null
      this.translatedCsvUrl = queryTranslatedCsv(newVal)
      if (store.currentMode !== DataMode.Raw) return
      this.pretranslatedCsvUrl = await queryPreTranslatedCsv(newVal)
      if (this.translatedCsvUrl) {
        this.notifyToSwitchToRemote(
          this.translatedCsvUrl,
          this.$t('translate.remoteTranslationDetectedTitle')
        )
        return
      }
      if (this.pretranslatedCsvUrl) {
        this.notifyToSwitchToRemote(
          this.pretranslatedCsvUrl,
          this.$t('translate.remotePreTranslationDetectedTitle')
        )
      }
    },
    data() {
      this.isPreviewing = false
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
    notifyToSwitchToRemote(url: string, title: string) {
      this.getNotification().success({
        title,
        meta: () =>
          h(
            'a',
            {
              onClick: () => {
                this.$router.push({
                  path: '/translate',
                  query: {
                    forceReload: '1',
                    source: DataSource.Remote,
                    id: url,
                  },
                  // hash: `#${url}`,
                })
              },
              style: {
                cursor: 'pointer',
              },
            },
            {
              default: () => this.$t('translate.remoteTranslationDetectedMeta'),
            }
          ),
        duration: 4000,
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
        messageType: 'iframeJson',
        iframeJson: JSON.parse(text),
        csvText: this.getCurrentDataString(),
      })
    },
    // openEvent() {
    //   window.open(this.iframeSrc!)
    // },
    // loadDataFromLocalStorage(jsonUrl: string) {
    //   this.isLoading = true
    //   const text = store.saves.saveDict[jsonUrl].csv
    //   store.csvFilename = store.saves.saveDict[jsonUrl].name || jsonUrl
    //   store.path = `//${store.csvFilename}`
    //   this.loadDataFromCsvText(text)
    // },

    // async loadDataFromGithubCsvUrl(url: string) {
    //   this.isLoading = true
    //   const { name, text } = await metaInfoFromGithubCsvUrl(url)
    //   store.csvFilename = name
    //   await this.loadDataFromCsvText(text)

    //   // TODO
    //   const info = extractInfoFromUrl(url)
    //   store.path = decodeURIComponent(info.path)
    // },
    // async loadDataFromJsonPathUrl(url: string) {
    //   this.isLoading = true
    //   const { name, text } = await metaInfoFromJsonPathUrl(url)
    //   store.csvFilename = name
    //   this.createWarningMessage(this.$t('translate.loadRawWarning'))
    //   store.path = `//${url.split('/').reverse()[0].replace('.json', '.csv')}`
    //   this.loadDataFromCsvText(text)
    // },
    // async loadDataFromFile(file: File) {
    //   this.isLoading = true
    //   let text = await file.text()
    //   store.csvFilename = file.name
    //   if (file.name.endsWith('.json')) {
    //     store.csvFilename = file.name.replace('.json', '.csv')
    //     text = jsonTextToCsvText(JSON.parse(text), null)
    //   }

    //   store.path = `//${file.name}`
    //   this.loadDataFromCsvText(text)
    // },
    async loadDataFromSourceInput(
      sourceInput: File | string,
      source: DataSource | null
    ) {
      try {
        this.data = []
        this.isPreviewing = false
        this.hasPreviewed = false
        this.isLoading = true
        const { data, jsonUrl, name, path, translator, mode } =
          await processSourceInput(sourceInput, source)
        store.jsonUrl = jsonUrl
        store.csvFilename = name
        store.path = path
        this.translator = translator
        store.currentMode = mode
        this.updateRelatedChapterStatus()
        if (mode === DataMode.Raw) {
          this.getNotification().warning({
            content: this.$t('translate.loadRawWarning'),
            duration: 2000,
          })
        }
        nextTick(() => {
          this.data = data
          this.isLoading = false
        })
      } catch (e: any) {
        console.log(e)
        alert(e)
      }
    },
    // todo: make this async
    // loadDataFromCsvText(text: string) {
    //   try {
    //     this.data = [] // force remove rendered elements to disable reuse
    //     this.isPreviewing = false
    //     this.hasPreviewed = false
    //     const { data, translator, jsonUrl } = extractInfoFromCsvText(text)
    //     this.jsonUrl = jsonUrl
    //     this.updateRelatedChapterStatus()
    //     this.translator = translator
    //     nextTick(() => {
    //       this.data = data
    //       this.isLoading = false
    //     })
    //   } catch (e) {
    //     alert(e)
    //   }
    // },
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
    getCurrentData(offset: number, limit: number): CsvDataLine[] {
      return this.data.filter((item, index) => {
        return index >= offset && index < offset + limit
      })
    },
    setCurrentTrans(trans: string[], offset: number, limit: number) {
      if (trans.length !== limit) {
        console.warn(trans)
        this.getNotification().warning({
          title: this.$t('translate.tab.preTranslate'),
          meta: `unexpected trans length: expected ${limit}, recieved ${trans.length}`,
          duration: 3000,
        })
      }
      const lines = this.$refs.lines as InstanceType<typeof DialogueLine>[]
      for (let index = 0; index < Math.min(limit, trans.length); index++) {
        lines[index + offset].local_trans = trans[index]
      }
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
    updateBase64Content() {
      const csv = this.getCurrentDataString()
      store.base64content = this.b64EncodeUnicode(csv)
    },
    saveCsvToLocalstorage() {
      console.log('saving')
      this.updateBase64Content()
      store.saves.setItem(this.jsonUrl, {
        csv: this.getCurrentDataString(),
        timeLabel: new Date().toLocaleString(),
        name: store.csvFilename,
      })
      this.getNotification().success({
        content: this.$t('translate.saveSuccess'),
        duration: 1000,
      })
    },
    async updateRelatedChapterStatus() {
      store.eventsCollectionMeta = searchIndexData(
        this.jsonUrl,
        await getIndexData()
      )
      // store.eventsCollectionMeta = await queryRelated(this.jsonUrl)
      // TODO: use eventsCollectionMeta for chapter navigation
      this.nextJsonUrl = await nextJsonUrl(
        this.jsonUrl,
        store.eventsCollectionMeta
      )
      this.previousJsonUrl = await previousJsonUrl(
        this.jsonUrl,
        store.eventsCollectionMeta
      )
      if (store.eventsCollectionMeta == null) {
        this.trueEndJsonUrl = await trueEndJsonUrl(this.jsonUrl)
        this.firstJsonUrl = await firstJsonUrl(this.jsonUrl)
      }
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
