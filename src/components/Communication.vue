// Communication.vue

<template>
  <div v-if="isLoading" class="loading">
    Loading...
  </div>
  <!-- the "communication" element contains the list of messages -->
  <button @click="downloadData" class="download-button">Download CSV</button>
  <div v-if="iframeSrc">
    <button @click="openEvent" class="preview-button">Preview Story↗</button>
    <button @click="previewStory" class="preview-button">Preview Story↓</button>
    <EventIframe :iframe-src="iframeSrc" v-if="isPreviewing"></EventIframe>
  </div>
  <div class="communication">
    <!-- use the "v-for" directive to loop over the "data" array and render a "DialogueLine" component for each item -->
    <DialogueLine v-for="(item, index) in data" :key="index" :index="index" :id="item.id" :name="item.name" :text="item.text"
      :trans="item.trans" :base="jsonUrl.split('.')[0]" ref="lines" />
    <TranslatorLine :name="'译者'" :trans="translator" ref="translator"></TranslatorLine>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import DialogueLine from './DialogueLine.vue'; // import the "DialogueLine" component
import * as Papa from 'papaparse'; // import PapaParse
import FileSaver from 'file-saver';
import Queue from '../helper/queue.js';
import EventIframe from './EventIframe.vue';
import TranslatorLine from './TranslatorLine.vue';

// define the interface for the CSV data
interface CsvData {
  id: string;
  name: string;
  text: string;
  trans: string;
}

export default defineComponent({
  // define the "DialogueLine" component as a child component
  components: {
    DialogueLine,
    EventIframe,
    TranslatorLine
},
  // the URL of the CSV data will be passed to the component as a prop
  props: {
    csvUrl: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      // store the parsed CSV data in a local variable
      data: [] as CsvData[],
      jsonUrl: "",
      translator: "",
      isLoading: false,
      isPreviewing: false,
      csvFileName: "",
    };
  },
  computed: {
    iframeSrc() {
      if (!this.jsonUrl) return null
      const eventType = this.jsonUrl.split("/")[0]
      const eventId = this.jsonUrl.split("/")[1].split(".")[0]
      return `https://event.strawberrytree.top/?eventType=${eventType}&eventId=${eventId}`
    }
  },
  methods: {
    previewStory() {
      this.isPreviewing = !this.isPreviewing
    },
    openEvent() {
      window.open(this.iframeSrc!)
    },
    // define a method to load the CSV data from the URL
    async loadDataFromUrl(url: string) {
      this.isLoading = true
      try {
        // use the fetch() function to request the CSV data from the URL
        if (url.startsWith("https://github.com")) {
          url = url.replace("github", "raw.githubusercontent").replace("/blob/", "/")
        }
        const response = await fetch(url);

        if (!response.ok) {
          alert("load failed")
          return
        }
        // if the response is successful, parse the CSV data
        
          // get the text of the response
        if (url.endsWith(".csv")) {
          this.csvFileName = decodeURI(url.split('/').reverse()[0])
          const text = await response.text();
          await this.loadDataFromCsvText(text)
        } else {
          alert("file format not supported: specify .csv or .json")
        }
      } catch (e) {
        alert(e)
      }
    },
    async loadDataFromCsvText(text: string) {
      try {
        const data: CsvData[] = Papa.parse(text, {
          header: true, // use the first row as the header
        }).data as CsvData[];

        let queue = new Queue<CsvData>;

        data.forEach((element: CsvData) => {
          if (element.id === "info") {
            this.jsonUrl = element.name
          } 
          if (element.id === "译者") {
            this.translator = element.name
          } 
          if (element.text) {
            queue.enqueue(element)
          }
        });

        if (!this.jsonUrl) {
          alert("CSV format wrong")
        }

        // store the parsed CSV data in the "data" variable
        this.data = data.filter((item: CsvData) => item.text) as CsvData[];
        this.isLoading = false
      } catch (e) {
        alert(e)
      }

    },
    downloadData() {
      // generate the updated CSV data by mapping over the "data" array and
      // replacing the "trans" property of each item with the updated value
      // from the "DialogueLine" components
      const lines: any[] = this.$refs.lines as any[];
      let updatedData = this.data.map((item, index) => {
        return {
          ...item,
          trans: lines[index].local_trans,
        };
      });

      const translatorLine: any = this.$refs.translator

      updatedData.push({
        "id": "info",
        "name": this.jsonUrl,
        "text": "",
        "trans": ""
      })
      updatedData.push({
        "id": "译者",
        "name": translatorLine.edit_trans,
        "text": "",
        "trans": ""
      })

      // convert the updated data array to a CSV string using the PapaParse library
      const csv = Papa.unparse(updatedData);

      // create a new Blob object with the CSV string as its content
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

      // use the FileSaver library to save the Blob object as a file
      FileSaver.saveAs(blob, this.csvFileName);
    },
  },
});
</script>

<style scoped>
/* add styles for the "Communication" component here */
.loading {
  font-size: 1.5em;
  font-weight: bold;
  color: red;
}

.download-button {
  position: fixed;
  top: 75px;
  right: 10px;
  opacity: 0.5;
}

</style>

