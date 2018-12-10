#!/usr/bin/env node

const temp = require('temp')
const gulp = require('gulp')
const connect = require('gulp-connect')
const createHTML = require('create-html')
const fromString = require('from2-string')
const source = require('vinyl-source-stream')
const browserify = require('browserify')
const fs = require('fs')
const path = require('path')
const resolve = require('resolve')
const opn = require('opn')

temp.track()

const cwd = process.cwd()
const package = require(`${cwd}/package.json`)
const skinDir = path.dirname(resolveSkin(package, cwd))
const out = temp.mkdirSync()

gulp.task('css', () => {
  return gulp.src(`${skinDir}/styles/**.css`)
    .pipe(gulp.dest(`${out}/css`))
})

gulp.task('html', () => {
  let stylesheets = ['style.css', 'deck.css']
    .map(s => `<link rel="stylesheet" href=css/${s}>`)
    .join('\n')

  let html = {
    title: 'nearForm Presentation',
    script: 'bundle.js',
    head: stylesheets,
    lang: 'en'
  }

  return fromString(createHTML(html))
    .pipe(source('index.html'))
    .pipe(gulp.dest(out))
    .pipe(connect.reload())
})

gulp.task('markdown', () => {
  return gulp.src(`${cwd}/deck.md`)
    .pipe(gulp.dest(`${out}`))
    .pipe(connect.reload())
})

gulp.task('images', () => {
  return gulp.src(`${skinDir}/images/**`)
    .pipe(gulp.dest(`${out}/images`))
})

gulp.task('deckImages', () => {
  return gulp.src(`${cwd}/images/**`)
    .pipe(gulp.dest(`${out}/images`))
    .pipe(connect.reload())
})

gulp.task('deckCSS', () => {
  return gulp.src(`${cwd}/deck.css`)
    .pipe(gulp.dest(`${out}/css`))
    .pipe(connect.reload())
})

gulp.task('js', () => {
  // remark isn't resolvable by require(), so this is a bit hacky

  let remarkPath = resolve.sync('@nearform/remark', {
    packageFilter: (pkg, pkgfile) => {
      pkg.main = 'src/remark.js'
      return pkg
    }
  })

  let remarkBase = path.dirname(remarkPath)

  let extReqs = fs.readdirSync(`${remarkBase}/remark/components`)
    .map((name) => {
      let path = `${remarkBase}/remark/components/${name}/${name}.js`

      return {
        file: path,
        expose: `components/${name}`
      }
    })
    .concat([
      {
        file: `${remarkBase}/remark.js`,
        expose: 'remark'
      }
    ])

  return browserify(`${__dirname}/app.js`)
    .require(extReqs)
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(out))
})

gulp.task('start-server', () => {
  connect.server({
    root: out,
    livereload: true
  })
})

gulp.task('watch', () => {
  gulp.watch(`${cwd}/deck.css`, ['deckCSS'])
  gulp.watch([`${cwd}/deck.md`], ['markdown'])
  gulp.watch([`${cwd}/images`], ['deckImages'])
})

gulp.task('open', ['serve'], function (done) {
  opn('http://localhost:8080', done)
})

gulp.task('serve', [
  'start-server',
  'html',
  'css',
  'js',
  'images',
  'deckImages',
  'markdown',
  'deckCSS',
])

gulp.task('default', [
  'open',
  'serve',
  'watch'
])

gulp.start.apply(gulp, [process.argv[2] ? process.argv[2] : 'default'])

function resolveSkin (package, cwd) {
  try {
    return resolve.sync(package.skin, {basedir: cwd})
  } catch (err) {
    throw new Error('Could not resolve "skin" in package.json. Is it missing?')
  }
}
