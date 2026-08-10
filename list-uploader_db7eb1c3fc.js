// lib/list-uploader.js
const fs = require('fs')
const FormData = require('form-data')
const axios = require('axios')

async function uploadListImage(pathFile) {
  if (!fs.existsSync(pathFile)) throw new Error('File not found: ' + pathFile)
  const stat = fs.statSync(pathFile)
  // telegra.ph punya limit ~5MB; cek dulu
  if (stat.size > 5 * 1024 * 1024) {
    throw new Error('File too large for telegra.ph (limit ~5MB). Size: ' + (stat.size / 1024 / 1024).toFixed(2) + 'MB')
  }

  const form = new FormData()
  form.append('file', fs.createReadStream(pathFile))

  try {
    const res = await axios.post('https://telegra.ph/upload', form, {
      headers: {
        ...form.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 20000
    })
    if (!res.data || !res.data[0] || !res.data[0].src) {
      throw new Error('Unexpected telegra.ph response: ' + JSON.stringify(res.data))
    }
    return 'https://telegra.ph' + res.data[0].src
  } catch (err) {
    // bantu debug: sertakan response.data jika ada
    if (err.response && err.response.data) {
      console.error('uploadListImage error response data:', err.response.status, err.response.data)
    } else {
      console.error('uploadListImage error:', err.message)
    }
    throw err
  }
}

module.exports = { uploadListImage }