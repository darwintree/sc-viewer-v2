import { DataMode, DataSource } from './enum-interfaces'
import { CsvDataLine, extractInfoFromCsvText, jsonTextToCsvText } from './csv'
import {
  extractInfoFromUrl,
  metaInfoFromGithubCsvUrl,
  metaInfoFromJsonPathUrl,
} from './path'
import { store } from '../store'
import CSV from 'papaparse'

// SCSP格式数据接口
interface ScspDataItem {
  key: string
  text: string
}

// 检测是否为SCSP格式
function isScspFormat(data: any): data is ScspDataItem[] {
  if (!Array.isArray(data)) return false
  if (data.length === 0) return true // 空数组视为SCSP格式
  const firstItem = data[0]
  return (
    firstItem &&
    typeof firstItem === 'object' &&
    'key' in firstItem &&
    'text' in firstItem &&
    Object.keys(firstItem).length === 2
  )
}

// SCSP格式转换为CSV文本
function scspTextToCsvText(data: ScspDataItem[]): string {
  const csvData: CsvDataLine[] = data.map((item) => ({
    id: item.key,
    name: '',
    text: item.text,
    trans: '',
  }))

  // 添加元信息行
  csvData.push({
    id: 'info',
    name: `${crypto.randomUUID()}.json`,
    text: '',
    trans: '',
  })

  // 添加译者行
  csvData.push({
    id: '译者',
    name: '',
    text: '',
    trans: '',
  })

  // 转换为CSV文本
  return CSV.unparse(csvData)
}

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

async function preprocessDiskSourceInput(
  sourceInput: File,
  jsonFormat?: 'sc' | 'scsp'
): Promise<{
  csvText: string // csv text
  name: string
  path: string
  mode: DataMode
  originalJsonData?: any // 保存原始JSON数据用于导出
}> {
  const name = sourceInput.name
  const text = await sourceInput.text()
  let csvText: string
  const mode = DataMode.File
  let originalJsonData: any

  if (name.endsWith('.csv')) {
    csvText = text
  } else if (name.endsWith('.json')) {
    const jsonData = JSON.parse(text)
    originalJsonData = jsonData

    if (jsonFormat === 'scsp' || isScspFormat(jsonData)) {
      csvText = scspTextToCsvText(jsonData)
    } else {
      csvText = jsonTextToCsvText(jsonData, null)
    }
  } else {
    throw new Error('expected .json or .csv file')
  }

  const path = `//${name}`
  return {
    csvText,
    name,
    path,
    mode,
    originalJsonData,
  }
}

async function preprocessSourceInput(
  sourceInput: File | string,
  source: DataSource | null,
  jsonFormat?: 'sc' | 'scsp'
): Promise<{
  csvText: string // csv text
  name: string
  path: string
  mode: DataMode
  originalJsonData?: any // 保存原始JSON数据用于导出
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
      return preprocessDiskSourceInput(sourceInput, jsonFormat)
    default:
      throw new Error('unreachable')
  }
}

async function processSourceInput(
  sourceInput: File | string,
  source: DataSource | null, // remote, browser or file(null)
  jsonFormat?: 'sc' | 'scsp'
): Promise<{
  data: CsvDataLine[]
  jsonUrl: string
  name: string
  path: string
  translator: string
  mode: DataMode
  originalJsonData?: unknown // 保存原始JSON数据用于导出
}> {
  const { csvText, name, mode, path, originalJsonData } =
    await preprocessSourceInput(sourceInput, source, jsonFormat)
  const { data, translator, jsonUrl } = extractInfoFromCsvText(csvText)
  return {
    data,
    jsonUrl,
    name,
    path,
    translator,
    mode,
    originalJsonData,
  }
}

// 检测文件是否为JSON格式
export async function detectJsonFormat(
  file: File
): Promise<'sc' | 'scsp' | null> {
  if (!file.name.endsWith('.json')) return null

  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (isScspFormat(data)) {
      return 'scsp'
    }
    return 'sc'
  } catch (error) {
    console.error('Error detecting JSON format:', error)
    return null
  }
}

// 导出函数：将CSV数据转换回SCSP格式JSON
export function exportToScspJson(
  csvData: CsvDataLine[],
  originalJsonData?: unknown
): string {
  if (!originalJsonData || !Array.isArray(originalJsonData)) {
    throw new Error('原始JSON数据无效')
  }

  // 创建key到翻译文本的映射
  const translationMap = new Map<string, string>()
  csvData.forEach((item) => {
    if (item.id && item.id !== 'info' && item.id !== '译者' && item.trans) {
      translationMap.set(item.id, item.trans)
    }
  })

  // 更新原始JSON数据的text字段
  const updatedData = (originalJsonData as any[]).map((item) => {
    if (item.key && translationMap.has(item.key)) {
      return {
        ...item,
        text: translationMap.get(item.key),
      }
    }
    return item
  })

  return JSON.stringify(updatedData, null, 2)
}

export { processSourceInput }
