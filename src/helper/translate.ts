import axios from 'axios'
import { CsvDataLine } from './csv'

const TRANSLATE_ENDPOINT = import.meta.env.VITE_TRANSLATE_ENDPOINT

async function translateDataLines(
  lines: CsvDataLine[],
  { token }: { token: string }
): Promise<string[]> {
  const prompt = lines.map((item, index) => {
    return {
      index,
      speaker: item.name,
      text: item.text,
    }
  })
  const res = await axios.post(`${TRANSLATE_ENDPOINT}`, prompt, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  // console.log(lines.length)
  // console.log(res.data)
  return res.data.map(
    (item: { speaker: string; text: string; trans: string }) => {
      if (item.text.length && item.text[item.text.length - 1] === '。') {
        item.text = item.text.substring(0, item.text.length - 1)
      }
      return `${item.text.replaceAll('\n', '\\n')}\\n[pre-translate]`
    }
  )
}

export { translateDataLines }
