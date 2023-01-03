import CSV from 'papaparse'

const trim = (str: String) => {
  if (!str) return ''
  let _str = str.replace(/[\u0020]+$/g, '')
  return _str.replace(/^[\u0020]+/g, '')
}

const replaceWrap = (text: String) => {
  if (typeof text === 'string') {
    return text.replace(/\r?\n/g, '\\n').replace(/\r/g, '\\n')
  }
  return text
}

const dataToCSV = (data: any[], name: String) => {
  const list = []
  data.forEach(item => {
    let text = trim(replaceWrap(item.text))
    if (text) {
      list.push({
        id: item.id || '0000000000000',
        name: item.speaker || '',
        text,
        trans: ''
      })
    } else if (item.select) {
      list.push({
        id: 'select',
        name: '',
        text: trim(replaceWrap(item.select)),
        trans: ''
      })
    }
  })
  list.push({
    id: 'info', name, text: '', trans: ''
  })
  list.push({
    id: '译者', name: '', text: '', trans: ''
  })
  return CSV.unparse(list)
}

export default dataToCSV
