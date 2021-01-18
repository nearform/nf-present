#!/usr/bin/env node

const { promises: fs } = require('fs')
const path = require('path')
const open = require('open')
const yargs = require('yargs')
const chokidar = require('chokidar')
const livereload = require('livereload')

const cwd = process.cwd()
const [markdownFilename] = yargs.argv._
const cssOpt = yargs.argv.css
const outOpt = yargs.argv.out
const outFilename = outOpt ? path.resolve(cwd, outOpt) : null
const shouldWatch = !!yargs.argv.watch || !!yargs.argv.w

const markdownPath = path.resolve(cwd, markdownFilename)
const remarkSrc = path.resolve(__dirname, './assets/remark-latest.min.js')
const cssFiles = [path.resolve(__dirname, './assets/styles.css')]

if (cssOpt) {
  cssFiles.push(path.resolve(cwd, cssOpt))
}

const liveReloadScript = `
<script>
document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
':35729/livereload.js?snipver=1"></' + 'script>')
</script> 
`

const generateHTML = ({ md, cssFiles, remarkSrc }) => `
<!DOCTYPE html>
<html>
  <head>
    <title>NearForm Workshop</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    ${
      cssFiles && cssFiles.length
        ? cssFiles
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
    ${shouldWatch ? liveReloadScript : ''}
  </body>
</html>
`

const processFiles = async () => {
  const md = await fs.readFile(markdownPath, 'utf8')
  const html = generateHTML({ md, cssFiles, remarkSrc })

  if (outOpt) {
    await fs.writeFile(outFilename, html, { encoding: 'utf8' })
    console.log('Written: ', outFilename)
  } else {
    process.stdout.write(html)
  }
}

;(async () => {
  try {
    await processFiles()
  } catch (error) {
    console.error(error)
    process.exit(1)
  }

  if (outOpt) {
    open(outFilename)

    if (shouldWatch) {
      const server = livereload.createServer()
      server.watch([...cssFiles, outFilename])

      console.log('Watching for changes...')
      chokidar
        .watch(markdownPath, {
          awaitWriteFinish: {
            stabilityThreshold: 2000,
            pollInterval: 100
          }
        })
        .on('change', () => {
          processFiles().catch(error => {
            console.error(error)
            process.exit(1)
          })
        })
        .on('unlink', path => {
          console.error('Error: markdown file missing: ', path)
          process.exit(1)
        })
        .on('error', error => {
          console.error(error)
          process.exit(1)
        })
    }
  }
})().catch(error => {
  console.error(error)
  process.exit(1)
})
