import axios from 'axios'
import xml2js from 'xml2js'
import cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import async from 'async'

const fetchPagesDetails = async () => {
  const sitemapURL = 'https://universe.eveonline.com/sitemap.xml'
  const response = await axios.get(sitemapURL)
  const parser = new xml2js.Parser()
  const result = await parser.parseStringPromise(response.data)
  const pages = result.urlset.url
    .map((urlItem) => urlItem.loc[0].replace('https://universe.eveonline.com/', '').split('/'))
    .filter(i => i.length === 2)
    .map(i => { return { section: i[0], pageName: i[1] } })
    .sort((a, b) => a.section.localeCompare(b.section))
  return pages
}
const crawlOne = async (section, pageName) => {
  const filePath = path.join('_data', section, `${pageName}.txt`)
  if (fs.existsSync(filePath)) {
    return
  }
  const url = `https://universe.eveonline.com/${section}/${pageName}`
  const res = await axios.get(url)
  const $ = cheerio.load(res.data)
  const articlesContent = []
  $('article').each((i, el) => {
    const article = $(el).text().trim()
    if (!article.startsWith('More ')) {
      articlesContent.push(article)
    }
  })
  //   console.log('articlesContent', articlesContent)
  if (!fs.existsSync(path.join('_data', section))) fs.mkdirSync(path.join('_data', section))
  fs.writeFileSync(filePath, articlesContent.join('\n'))
}

const crawlPages = async (pages) => {
  if (!fs.existsSync('_data')) fs.mkdirSync('_data')
  //   pages = pages.slice(0, 20)
  const total = pages.length
  console.log('crawlPages: START')
  await async.eachOfLimit(pages, 10, async (page, i) => {
    console.log(`${i + 1} of ${total} :`, page.section, '/', page.pageName)
    await crawlOne(page.section, page.pageName)
  })
  console.log('crawlPages: END')
}
const initCrawl = async () => {
  const pages = await fetchPagesDetails()
  const counts = pages.reduce((p, c) => { p[c.section] = (p[c.section] || 0) + 1; return p }, {})
  console.log('counts', counts)
  await crawlPages(pages)
}

initCrawl()
