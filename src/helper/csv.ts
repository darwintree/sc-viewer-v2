import Papa from 'papaparse';

interface CsvDataLine {
  id: string;
  name: string;
  text: string;
  trans: string;
}

interface CsvTextInfo {
  data: CsvDataLine[],
  translator: string,
  jsonUrl: string,
}

function extractInfoFromCsvText(text: string): CsvTextInfo {
  const data: CsvDataLine[] = Papa.parse(text, {
    header: true, // use the first row as the header
  }).data as CsvDataLine[];
  let jsonUrl = "";
  let translator = "";
  data.forEach((element: CsvDataLine) => {
    if (element.id === "info") {
      jsonUrl = element.name
    }
    if (element.id === "译者") {
      translator = element.name
    }
  });
  if (!jsonUrl) {
    throw new Error("Wrong CSV format")
  }
  return {
    data: data.filter((item: CsvDataLine) => item.text) as CsvDataLine[],
    translator,
    jsonUrl,
  }
}

function toCsvText(info: CsvTextInfo) {
  info.data.push({
    "id": "info",
    "name": info.jsonUrl,
    "text": "",
    "trans": ""
  })
  info.data.push(
    {
      "id": "译者",
      "name": info.translator,
      "text": "",
      "trans": ""
    }
  )
  return Papa.unparse(info.data);
}

export type { CsvDataLine }
export { extractInfoFromCsvText, toCsvText }
