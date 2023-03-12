import CSV from 'papaparse'

const trim = (str: string) => {
  if (!str) return ''
  const _str = str.replace(/[\u0020]+$/g, '')
  return _str.replace(/^[\u0020]+/g, '')
}

const replaceWrap = (text: string) => {
  if (typeof text === 'string') {
    return text.replace(/\r?\n/g, '\\n').replace(/\r/g, '\\n')
  }
  return text
}

function jsonPathFromData(data: any[]) {
  let name = ''
  data.some((item) => {
    if (item.voice) {
      const splits = item.voice.split('/')
      if (splits.length == 3) {
        name = `${splits[0]}/${splits[1]}.json`
      }
      return true
    }
    return false
  })
  return name
}

const dataToCSV = (data: any[], jsonPath: string | null) => {
  const list = []
  data.forEach((item) => {
    const text = trim(replaceWrap(item.text))
    if (text) {
      list.push({
        id: item.id || '0000000000000',
        name: item.speaker || '',
        text,
        trans: '',
      })
    } else if (item.select) {
      list.push({
        id: 'select',
        name: '',
        text: trim(replaceWrap(item.select)),
        trans: '',
      })
    }
  })
  if (!jsonPath) {
    jsonPath = jsonPathFromData(data)
  }
  list.push({
    id: 'info',
    name: jsonPath,
    text: '',
    trans: '',
  })
  list.push({
    id: '译者',
    name: '',
    text: '',
    trans: '',
  })
  return CSV.unparse(list)
}

export default dataToCSV
