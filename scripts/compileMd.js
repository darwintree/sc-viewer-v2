import MarkdownIt from 'markdown-it'
import { writeFileSync, readFileSync } from 'fs'


const files = [
  "CHANGELOG.md",
  "GAMEUPDATES.md"
]

files.forEach((file) => {
  const text = readFileSync(`./${file}`).toString("utf-8")
  let html = (new MarkdownIt()).render(text)
  writeFileSync(
    `./public/${file.replace(".md", ".html")}`,
    html,
    {
      encoding: "utf-8"
    }
  )
})
