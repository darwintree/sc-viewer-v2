import axios from 'axios'
import { CsvDataLine } from './csv'

const TRANSLATE_ENDPOINT = import.meta.env.VITE_TRANSLATE_ENDPOINT

// return value expected in the format of index|speaker|text|translation
// with potential
function resolveRtnStr(
  len: number,
  rtnStr: string,
  withTag: boolean
): string[] {
  const rtn = new Array(len).fill('')
  const rtnLines = rtnStr.replaceAll('\r\n', '\n').split('\n')
  rtnLines.forEach((item) => {
    const lineSplits = item.split('|')
    if (lineSplits.length >= 2) {
      const index = Number(lineSplits[0])
      // the translation should be the third element
      // else use the last element
      const translation = lineSplits[3] || lineSplits[lineSplits.length - 1]
      rtn[index] = translation
      if (withTag) {
        rtn[index] += '\n[pre-translate]'
      }
    }
  })
  return rtn
}

async function translateDataLines(
  lines: CsvDataLine[],
  { token, withTag }: { token: string; withTag: boolean }
): Promise<string[]> {
  let prompt = ''
  lines.forEach((item, index) => {
    prompt += `${index}|${item.name}|${item.text}\n`
  })
  const res = await axios.post(
    `${TRANSLATE_ENDPOINT}`,
    { prompt },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
  const rtnStr: string = res.data
  return resolveRtnStr(lines.length, rtnStr, withTag)
}

export { translateDataLines }
