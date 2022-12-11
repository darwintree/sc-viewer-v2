// Communication.vue

<template>
  <div v-if="isLoading" class="loading">
    Loading...
  </div>
  <!-- the "communication" element contains the list of messages -->
  <button @click="downloadCsv" class="download-button">Download CSV</button>
  <div class="communication">
    <!-- use the "v-for" directive to loop over the "data" array and render a "DialogueLine" component for each item -->
    <DialogueLine v-for="(item, index) in data" :key="index" :id="item.id" :name="item.name" :text="item.text"
      :trans="item.trans" :base="urlLine.name.split('.')[0]" ref="lines" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import DialogueLine from './DialogueLine.vue'; // import the "DialogueLine" component
import * as Papa from 'papaparse'; // import PapaParse
import FileSaver from 'file-saver';

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
      urlLine: {} as CsvData,
      translatorLine: {} as CsvData,
      isLoading: false,
    };
  },
  mounted() {
    // when the component is mounted, load the CSV data from the URL
    this.loadCsv();
  },
  methods: {
    async loadCsv() {
      await this.loadCsvFromUrl(this.csvUrl)
    },
    // define a method to load the CSV data from the URL
    async loadCsvFromUrl(url: string) {
      this.isLoading = true
      try {
        // use the fetch() function to request the CSV data from the URL
        const response = await fetch(url);

        // if the response is successful, parse the CSV data
        if (response.ok) {
          // get the text of the response
          const text = await response.text();
          this.loadCsvFromText(text)
        } else {
          alert("load failed")
        }
      } catch (e) {
        alert(e)
      }
    },
    loadCsvFromText(text: string) {
      try {
        const data: CsvData[] = Papa.parse(text, {
          header: true, // use the first row as the header
        }).data as CsvData[];

        data.forEach((element: CsvData) => {
          if (element.id === "info") {
            this.urlLine = element
          }
          if (element.id === "译者") {
            this.translatorLine = element
          }
        });

        // store the parsed CSV data in the "data" variable
        this.data = data.filter((item: CsvData) => item.text) as CsvData[];
        this.isLoading = false
      } catch (e) {
        alert(e)
      }

    },
    downloadCsv() {
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

      updatedData.push(this.urlLine)
      updatedData.push(this.translatorLine)

      // convert the updated data array to a CSV string using the PapaParse library
      const csv = Papa.unparse(updatedData);

      // create a new Blob object with the CSV string as its content
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

      // use the FileSaver library to save the Blob object as a file
      FileSaver.saveAs(blob, 'updated-translations.csv');
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
  top: 10px;
  right: 10px;
}

</style>

