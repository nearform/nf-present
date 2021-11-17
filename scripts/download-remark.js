const https = require('https')
const fs = require('fs')
const { pipeline } = require('stream/promises')
const path = require('path')

https.get('https://remarkjs.com/downloads/remark-latest.min.js', (res) =>
  pipeline(
    res,
    fs.createWriteStream(
      path.resolve(__dirname, '../assets/remark-latest.min.js')
    )
  )
)
