#!/usr/bin/env node

const { promises: fs } = require('fs')
const open = require('open')
const yargs = require('yargs')
const chokidar = require('chokidar')

const cwd = process.cwd()
const [markdownFilename] = yargs.argv._
const cssOpt = yargs.argv.css
const outOpt = yargs.argv.out
const shouldWatch = !!yargs.argv.watch || !!yargs.argv.w

const markdownPath = `${cwd}/${markdownFilename}`
const outFilename = `${cwd}/${outOpt}`
const remarkSrc = `${__dirname}/assets/remark-latest.min.js`
const nfStylesSrc = `${__dirname}/assets/styles.css`

const generateHTML = ({ md, cssLinks, remarkSrc }) => `
<!DOCTYPE html>
<html>
  <head>
    <title>NearForm Workshop</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    ${
      cssLinks && cssLinks.length
        ? cssLinks
            .map(
              href => `<link rel="stylesheet" type="text/css" href="${href}">`
            )
            .join('')
        : ''
    }
  </head>
  <body>
    <textarea id="source" style="display: none">${md}</textarea>
    <script src="${remarkSrc}" type="text/javascript">
    </script>
    <script type="text/javascript">
      var slideshow = remark.create();
    </script>
  </body>
</html>
`

const processFiles = async () => {
  const md = await fs.readFile(markdownPath, 'utf8')
  const html = generateHTML({ md, cssLinks: [nfStylesSrc, cssOpt], remarkSrc })

  if (outOpt) {
    await fs.writeFile(outFilename, html, { encoding: 'utf8' })
    console.log('Written: ', outFilename)
  } else {
    process.stdout.write(html)
  }
}

;(async () => {
  await processFiles()

  if (outOpt) {
    open(outFilename)

    if (shouldWatch) {
      console.log('Watching for changes...')
      chokidar.watch(markdownPath).on('change', () => {
        processFiles()
      })
    }
  }
})()
