import { DataMode, DataSource } from './enum-interfaces'
import { CsvDataLine, extractInfoFromCsvText, jsonTextToCsvText } from './csv'
import {
  extractInfoFromUrl,
  metaInfoFromGithubCsvUrl,
  metaInfoFromJsonPathUrl,
} from './path'
import { store } from '../store'

async function preprocessRemoteSourceInput(sourceInput: string): Promise<{
  csvText: string // csv text
  name: string
  path: string
  mode: DataMode
}> {
  if (sourceInput.endsWith('.csv')) {
    // a url ends with .csv is expected to be a github url
    const mode = DataMode.Server
    const { name, text } = await metaInfoFromGithubCsvUrl(sourceInput)
    const { path } = extractInfoFromUrl(sourceInput)
    return {
      name,
      path: decodeURIComponent(path),
      csvText: text,
      mode,
    }
  } else if (sourceInput.endsWith('.json')) {
    // a url ends with .json is expected to be a raw json
    const mode = DataMode.Raw
    const { name, text } = await metaInfoFromJsonPathUrl(sourceInput)
    const path = `//${sourceInput
      .split('/')
      .reverse()[0]
      .replace('.json', '.csv')}`
    return {
      csvText: text,
      name,
      path,
      mode,
    }
  } else {
    console.log(sourceInput)
    const errMsg = 'unexpected url: should ends with .csv or .json'
    alert(errMsg)
    throw new Error(errMsg)
  }
}

async function preprocessBrowserSourceInput(sourceInput: string): Promise<{
  csvText: string // csv text
  name: string
  path: string
  mode: DataMode
}> {
  const text = store.saves.saveDict[sourceInput].csv
  const name = store.saves.saveDict[sourceInput].name || sourceInput
  const path = `//${name}`
  const mode = DataMode.History
  return {
    csvText: text,
    name,
    path,
    mode,
  }
}

async function preprocessDiskSourceInput(sourceInput: File): Promise<{
  csvText: string // csv text
  name: string
  path: string
  mode: DataMode
}> {
  const name = sourceInput.name
  const text = await sourceInput.text()
  let csvText: string
  const mode = DataMode.File
  if (name.endsWith('.csv')) {
    csvText = text
  } else if (name.endsWith('.json')) {
    csvText = jsonTextToCsvText(JSON.parse(text), null)
  } else {
    throw new Error('expected .json or .csv file')
  }

  const path = `//${name}`
  return {
    csvText,
    name,
    path,
    mode,
  }
}

async function preprocessSourceInput(
  sourceInput: File | string,
  source: DataSource | null
): Promise<{
  csvText: string // csv text
  name: string
  path: string
  mode: DataMode
}> {
  switch (source) {
    case DataSource.Remote:
      if (typeof sourceInput !== 'string')
        throw new Error('unexpected source input')
      return preprocessRemoteSourceInput(sourceInput)
    case DataSource.Browser:
      if (typeof sourceInput !== 'string')
        throw new Error('unexpected source input')
      return preprocessBrowserSourceInput(sourceInput)
    case null:
      if (typeof sourceInput === 'string')
        throw new Error('unexpected source input')
      return preprocessDiskSourceInput(sourceInput)
    default:
      throw new Error('unreachable')
  }
}

async function processSourceInput(
  sourceInput: File | string,
  source: DataSource | null // remote, browser or file(null)
): Promise<{
  data: CsvDataLine[]
  jsonUrl: string
  name: string
  path: string
  translator: string
  mode: DataMode
}> {
  const { csvText, name, mode, path } = await preprocessSourceInput(
    sourceInput,
    source
  )
  const { data, translator, jsonUrl } = extractInfoFromCsvText(csvText)
  return {
    data,
    jsonUrl,
    name,
    path,
    translator,
    mode,
  }
}

export { processSourceInput }
