const axios = require('axios');
const crypto = require('crypto')
const cheerio = require("cheerio")
const https = require('https')
const FormData = require('form-data')
const { spawn } = require('child_process')
const path = require('path')
const qs = require("qs")
const fs = require('fs')
const { tmpdir } = require('os')

const ROOT = process.cwd()
const TMP_DIR = path.join(ROOT, 'media', 'sampah')
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true })
}


async function tiktokSearchVideo(query) {
	return new Promise(async (resolve, reject) => {
		axios("https://tikwm.com/api/feed/search", {
			headers: {
				"content-type": "application/x-www-form-urlencoded; charset=UTF-8",
				cookie: "current_language=en",
				"User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
			},
			data: {
				keywords: query,
				count: 12,
				cursor: 0,
				web: 1,
				hd: 1,
			},
			method: "POST",
		}).then((res) => {
			resolve(res.data.data);
		});
	});
}

async function tiktokDownloaderVideo(url) {
	return new Promise(async (resolve, reject) => {
		try {
			let data = []
			function formatNumber(integer) {
				let numb = parseInt(integer)
				return Number(numb).toLocaleString().replace(/,/g, '.')
			}
			
			function formatDate(n, locale = 'en') {
				let d = new Date(n)
				return d.toLocaleDateString(locale, {
					weekday: 'long',
					day: 'numeric',
					month: 'long',
					year: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric'
				})
			}
			
			let domain = 'https://www.tikwm.com/api/';
			let res = await (await axios.post(domain, {}, {
				headers: {
					'Accept': 'application/json, text/javascript, */*; q=0.01',
					'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
					'Origin': 'https://www.tikwm.com',
					'Referer': 'https://www.tikwm.com/',
					'Sec-Ch-Ua': '"Not)A;Brand" ;v="24" , "Chromium" ;v="116"',
					'Sec-Ch-Ua-Mobile': '?1',
					'Sec-Ch-Ua-Platform': 'Android',
					'Sec-Fetch-Dest': 'empty',
					'Sec-Fetch-Mode': 'cors',
					'Sec-Fetch-Site': 'same-origin',
					'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
					'X-Requested-With': 'XMLHttpRequest'
				},
				params: {
					url: url,
					count: 12,
					cursor: 0,
					web: 1,
					hd: 1
				}
			})).data.data

			if (!res.size) {
				res.images.map(v => {
					data.push({ type: 'photo', url: v })
				})
			} else {
				data.push({
					type: 'watermark',
					url: 'https://www.tikwm.com' + res.wmplay,
				}, {
					type: 'nowatermark',
					url: 'https://www.tikwm.com' + res.play,
				}, {
					type: 'nowatermark_hd',
					url: 'https://www.tikwm.com' + res.hdplay
				})
			}

			let json = {
				status: true,
				title: res.title,
				taken_at: formatDate(res.create_time).replace('1970', ''),
				region: res.region,
				id: res.id,
				durations: res.duration,
				duration: res.duration + ' Seconds',
				cover: 'https://www.tikwm.com' + res.cover,
				size_wm: res.wm_size,
				size_nowm: res.size,
				size_nowm_hd: res.hd_size,
				data: data,
				music_info: {
					id: res.music_info.id,
					title: res.music_info.title,
					author: res.music_info.author,
					album: res.music_info.album ? res.music_info.album : null,
					url: res.music 
						? 'https://www.tikwm.com' + res.music 
						: res.music_info.play
				},
				stats: {
					views: formatNumber(res.play_count),
					likes: formatNumber(res.digg_count),
					comment: formatNumber(res.comment_count),
					share: formatNumber(res.share_count),
					download: formatNumber(res.download_count)
				},
				author: {
					id: res.author.id,
					fullname: res.author.unique_id,
					nickname: res.author.nickname,
					avatar: 'https://www.tikwm.com' + res.author.avatar
				}
			}

			resolve(json)
		} catch (e) {
			reject(e)
		}
	});
};


async function tiktokdl(url) {
try {
const res = await axios.post(
"https://savetik.co/api/ajaxSearch",
new URLSearchParams({
q: url,
lang: "id",
cftoken: ""
}).toString(),
{
headers: {
"content-type": "application/x-www-form-urlencoded; charset=UTF-8",
"origin": "https://savetik.co",
"referer": "https://savetik.co/id/tiktok-photo-downloader",
"user-agent": "Mozilla/5.0"
}
})

const html = res.data?.data
if (!html) throw new Error("Gagal scrape")

const $ = cheerio.load(html)
const isSlide = $(".photo-list").length > 0
const title = $(".content h3").text().trim()

let urls = []
let audio = null

if (isSlide) {
$(".download-items__btn a").each((i, el) => {
const href = $(el).attr("href")
if (href && href.includes("snapcdn")) urls.push(href)
})
} else {
$(".dl-action a").each((i, el) => {
const href = $(el).attr("href")
const text = $(el).text()
if (href && href.includes("snapcdn") && text.includes("MP4")) {
urls.push(href)
}
})
}

audio = $(".dl-action a")
.filter((i, el) => $(el).text().includes("MP3"))
.attr("href") || null

return {
type: isSlide ? "slide" : "video",
title,
urls,
audio
}

} catch (e) {
console.error("tiktokdl error:", e.message)
return null
}
}

module.exports = { tiktokdl }



async function tiktokDownloaderAudio(url) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
      "Referer": "https://www.tikwm.com/",
      "Accept": "*/*"
    }
  })
  return res.data
}


async function igDownload(url) {
  if (!url) {
    return { success: false, message: 'URL tidak boleh kosong' }
  }

  const base = 'https://fastvidl.com/api/lookup'
  const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36"
  
  try {
    const res = await axios.post(base, { "url": url }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': UA,
        'Origin': 'https://fastvidl.com',
        'Referer': 'https://fastvidl.com/'
      }
    });

    const data = res.data;

    if (!data || !data.ok) {
      return { 
        success: false, 
        message: data?.message || 'Gagal mendapatkan data dari API'
      }
    }

    const mediaList = (data.media || []).map(item => ({
      type: item.type?.toLowerCase() === 'video' ? 'video' : 'image',
      url: item.url || null,
      quality: item.quality || 'HD',
      thumbnail: item.thumbnail || null,
      label: item.label || 'Media'
    }))

    const links = mediaList.length > 0 
      ? mediaList 
      : [{
        type: data.type?.toLowerCase() === 'video' ? 'video' : 'image',
        url: data.url || null,
        quality: data.quality || 'HD',
        thumbnail: data.thumbnail || null
      }]

    return {
      success: true,
      type: data.type || 'unknown',
      caption: data.caption || '',
      links: links.filter(l => l.url) // filter yang ada URL-nya
    }

  } catch (error) {
    let errorMsg = 'Terjadi kesalahan saat download'
    
    if (error.response?.status) {
      errorMsg = `API Error (${error.response.status}): ${error.response.data?.message || 'Unknown'}`
    } else if (error.message) {
      errorMsg = String(error.message)
    }
    
    return { 
      success: false, 
      message: errorMsg
    }
  }
}



async function capcutDownload(url) {
    try {
        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        })

        const templateId =
            html.match(/"templateId":"(\d+)"/)?.[1] ||
            html.match(/template_id=(\d+)/)?.[1]

        const title =
            html.match(/"title":"([^"]+)"/)?.[1] ||
            html.match(/property="og:title" content="([^"]+)"/)?.[1]

        const description =
            html.match(/property="og:description" content="([^"]+)"/)?.[1]

        const cover =
            html.match(/"coverUrl":"([^"]+)"/)?.[1]
                ?.replace(/\\u002F/g, '/')

        const video =
            html.match(
                /property="og:video:url" content="([^"]+)"/
            )?.[1]

        const author =
            html.match(
                /"author":\{"name":"([^"]+)"/
            )?.[1]

        const usage =
            html.match(/"usageAmount":(\d+)/)?.[1]

        const likes =
            html.match(/"likeAmount":(\d+)/)?.[1]

        if (!video)
            throw new Error('Video preview tidak ditemukan')

        return {
            templateId,
            title,
            description,
            author,
            usage,
            likes,
            cover,
            video
        }

    } catch (err) {
        throw err
    }
}

function pinterest(query) {
  return new Promise(async (resolve, reject) => {
    try {
      const { data } = await axios.get(
        'https://id.pinterest.com/search/pins/?autologin=true&q=' + query,
        {
          headers: {
            cookie: '_auth=1; _b="AVna7S1p7l1C5I9u0+nR3YzijpvXOPc6d09SyCzO+DcwpersQH36SmGiYfymBKhZcGg="; _pinterest_sess=TWc9PSZHamJOZ0JobUFiSEpSN3Z4a2NsMk9wZ3gxL1NSc2k2NkFLaUw5bVY5cXR5alZHR0gxY2h2MVZDZlNQalNpUUJFRVR5L3NlYy9JZkthekp3bHo5bXFuaFZzVHJFMnkrR3lTbm56U3YvQXBBTW96VUgzVUhuK1Z4VURGKzczUi9hNHdDeTJ5Y2pBTmxhc2owZ2hkSGlDemtUSnYvVXh5dDNkaDN3TjZCTk8ycTdHRHVsOFg2b2NQWCtpOWxqeDNjNkk3cS85MkhhSklSb0hwTnZvZVFyZmJEUllwbG9UVnpCYVNTRzZxOXNJcmduOVc4aURtM3NtRFo3STlmWjJvSjlWTU5ITzg0VUg1NGhOTEZzME9SNFNhVWJRWjRJK3pGMFA4Q3UvcHBnWHdaYXZpa2FUNkx6Z3RNQjEzTFJEOHZoaHRvazc1c1UrYlRuUmdKcDg3ZEY4cjNtZlBLRTRBZjNYK0lPTXZJTzQ5dU8ybDdVS015bWJKT0tjTWYyRlBzclpiamdsNmtpeUZnRjlwVGJXUmdOMXdTUkFHRWloVjBMR0JlTE5YcmhxVHdoNzFHbDZ0YmFHZ1VLQXU1QnpkM1FqUTNMTnhYb3VKeDVGbnhNSkdkNXFSMXQybjRGL3pyZXRLR0ZTc0xHZ0JvbTJCNnAzQzE0cW1WTndIK0trY05HV1gxS09NRktadnFCSDR2YzBoWmRiUGZiWXFQNjcwWmZhaDZQRm1UbzNxc21pV1p5WDlabm1UWGQzanc1SGlrZXB1bDVDWXQvUis3elN2SVFDbm1DSVE5Z0d4YW1sa2hsSkZJb1h0MTFpck5BdDR0d0lZOW1Pa2RDVzNySWpXWmUwOUFhQmFSVUpaOFQ3WlhOQldNMkExeDIvMjZHeXdnNjdMYWdiQUhUSEFBUlhUVTdBMThRRmh1ekJMYWZ2YTJkNlg0cmFCdnU2WEpwcXlPOVZYcGNhNkZDd051S3lGZmo0eHV0ZE42NW8xRm5aRWpoQnNKNnNlSGFad1MzOHNkdWtER0xQTFN5Z3lmRERsZnZWWE5CZEJneVRlMDd2VmNPMjloK0g5eCswZUVJTS9CRkFweHc5RUh6K1JocGN6clc1JmZtL3JhRE1sc0NMTFlpMVErRGtPcllvTGdldz0=; _ir=0'
          }
        }
      )

      const $ = cheerio.load(data)
      const hasil = []

      $('div > a img').each((_, img) => {
        const src = $(img).attr('src')
        if (src) hasil.push(src.replace(/236/g, '736'))
      })

      hasil.shift()
      resolve(hasil)
    } catch (e) {
      reject(e)
    }
  })
}

async function pinterest2(query) {
	return new Promise(async (resolve, reject) => {
		const baseUrl = 'https://www.pinterest.com/resource/BaseSearchResource/get/';
		const queryParams = {
			source_url: '/search/pins/?q=' + encodeURIComponent(query),
			data: JSON.stringify({
				options: {
					isPrefetch: false,
					query,
					scope: 'pins',
					no_fetch_context_on_resource: false
				},
				context: {}
			}),
			_: Date.now()
		};
		const url = new URL(baseUrl);
		Object.entries(queryParams).forEach(entry => url.searchParams.set(entry[0], entry[1]));
		try {
			const json = await (await fetch(url.toString())).json();
			const results = json.resource_response?.data?.results?? [];
			const result = results.map(item => ({
				pin: 'https://www.pinterest.com/pin/' + item.id?? '',
				link: item.link?? '',
				created_at: (new Date(item.created_at)).toLocaleDateString('id-ID', {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				}) ?? '',
				id: item.id?? '',
				images_url: item.images?.['736x']?.url?? '',
				grid_title: item.grid_title?? ''
			}));
			resolve(result);
		} catch (e) {
			reject([])
		}
	});
}

async function mediafire (query) {
	return new Promise((resolve, reject) => {
		axios.get(query)
			.then(({
				data
			}) => {
				const $ = cheerio.load(data)
				const judul = $('body > div.mf-dlr.page.ads-alternate > div.content > div.center > div > div.dl-btn-cont > div.dl-btn-labelWrap > div.promoDownloadName.notranslate > div').text();
				const size = $('body > div.mf-dlr.page.ads-alternate > div.content > div.center > div > div.dl-info > ul > li:nth-child(1) > span').text();
				const upload_date = $('body > div.mf-dlr.page.ads-alternate > div.content > div.center > div > div.dl-info > ul > li:nth-child(2) > span').text();
				const link = $('#downloadButton').attr('href')
				const hsil = {
					judul: link.split('/')[5],
					upload_date: upload_date,
					size: size,
					mime: link.split('/')[5].split('.')[1],
					link: link
				}
				resolve(hsil)
			})
			.catch(reject)
	})
}

async function remini(buffer, mode = 'enhance') {
  const allowedMode = ['enhance', 'recolor', 'dehaze']
  if (!allowedMode.includes(mode)) mode = 'enhance'

  const form = new FormData()
  form.append('model_version', 1)
  form.append('image', buffer, {
    filename: 'image.jpg',
    contentType: 'image/jpeg'
  })

  const url = `https://inference.remini.ai/${mode}`

  const { data } = await axios.post(url, form, {
    headers: {
      ...form.getHeaders(),
      'User-Agent': 'Mozilla/5.0',
      'Accept-Encoding': 'gzip'
    },
    responseType: 'arraybuffer'
  })

  return Buffer.from(data)
}


// ========================================= \\

function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  return new Promise(async (resolve, reject) => {
    const id = Date.now()

    const input = path.join(TMP_DIR, `${id}.${ext}`)
    const output = path.join(TMP_DIR, `${id}.${ext2}`)

    try {
      await fs.promises.writeFile(input, buffer)

      const ff = spawn('ffmpeg', [
        '-y',
        '-i', input,
        ...args,
        output
      ])

      ff.on('error', err => reject(err))

      ff.on('close', async (code) => {
        try {
          await fs.promises.unlink(input)

          if (code !== 0) {
            return reject(new Error(`FFMPEG EXIT CODE ${code}`))
          }

          const result = await fs.promises.readFile(output)
          await fs.promises.unlink(output)

          resolve(result)
        } catch (err) {
          reject(err)
        }
      })

    } catch (err) {
      reject(err)
    }
  })
}

function toAudio(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-ac', '2',
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'mp3'
  ], ext, 'mp3')
}

function toPTT(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on',
    '-compression_level', '10'
  ], ext, 'opus')
}

function toVideo(buffer, ext) {
  return ffmpeg(buffer, [
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-ab', '128k',
    '-ar', '44100',
    '-crf', '32',
    '-preset', 'slow'
  ], ext, 'mp4')
}


async function getLyrics(song) {
  try {
    const headers = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }

    // 🔍 SEARCH (ENDPOINT STABIL)
    const searchUrl = `https://www.lyrics.com/search.php?q=${encodeURIComponent(song)}`
    const searchRes = await axios.get(searchUrl, headers)
    const $ = cheerio.load(searchRes.data)

    const first = $('table.tdata tr').eq(1)
    if (!first.length) return null

    const title = first.find('strong').text().trim()
    const artist = first.find('td').eq(2).text().trim()
    const linkPath = first.find('a').attr('href')
    if (!linkPath) return null

    const link = 'https://www.lyrics.com' + linkPath

    // 📜 GET LYRICS
    const lyricRes = await axios.get(link, headers)
    const $$ = cheerio.load(lyricRes.data)

    const lyrics =
      $$('#lyric-body-text').text().trim() ||
      $$('.lyric-body').text().trim()

    if (!lyrics) return null

    return {
      title,
      artist,
      lyrics
    }

  } catch (e) {
    return null
  }
}

function genSerial(){
  let s = ''
  for(let i=0;i<32;i++) s += Math.floor(Math.random()*16).toString(16)
  return s
}

async function DinosaurusHD(buffer, level = 6){
  const serial = genSerial()

  const tmp = path.join(tmpdir(), `hd-${Date.now()}.jpg`)
  fs.writeFileSync(tmp, buffer)

  const form = new FormData()
  form.append('original_image_file', fs.createReadStream(tmp))
  form.append('upscale_type', String(level))

  const create = await axios.post(
    'https://api.imgupscaler.ai/api/image-upscaler/v2/upscale/create-job',
    form,
    {
      headers:{
        ...form.getHeaders(),
        'User-Agent':'Mozilla/5.0 (Linux; Android 10)',
        'product-serial':serial,
        timezone:'Asia/Jakarta',
        origin:'https://imgupscaler.ai',
        referer:'https://imgupscaler.ai/'
      }
    }
  ).then(r=>r.data)

  if(create.code !== 100000) throw new Error('Create job gagal')

  const job = create.result.job_id

  while(true){
    await new Promise(r=>setTimeout(r,3000))

    const res = await axios.get(
      'https://api.imgupscaler.ai/api/image-upscaler/v1/universal_upscale/get-job/'+job,
      {
        headers:{
          'User-Agent':'Mozilla/5.0 (Linux; Android 10)',
          'product-serial':serial,
          origin:'https://imgupscaler.ai',
          referer:'https://imgupscaler.ai/'
        }
      }
    ).then(r=>r.data)

    if(res.code === 100000 && res.message?.en === 'Image generated successfully.'){
      fs.unlinkSync(tmp)
      return res.result.output_url
    }
  }
}

function Igstory(username){
	return new Promise(async(resolve, reject) => {
		axios.request({
			url: 'https://www.instagramsave.com/instagram-story-downloader.php',
			method: 'GET',
			headers:{
				"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
				"cookie": "PHPSESSID=ugpgvu6fgc4592jh7ht9d18v49; _ga=GA1.2.1126798330.1625045680; _gid=GA1.2.1475525047.1625045680; __gads=ID=92b58ed9ed58d147-221917af11ca0021:T=1625045679:RT=1625045679:S=ALNI_MYnQToDW3kOUClBGEzULNjeyAqOtg"
			}
		})
		.then(({ data }) => {
			const $ = cheerio.load(data)
			const token = $('#token').attr('value')
			let config ={
				headers: {
					'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
					"sec-ch-ua": '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
					"cookie": "PHPSESSID=ugpgvu6fgc4592jh7ht9d18v49; _ga=GA1.2.1126798330.1625045680; _gid=GA1.2.1475525047.1625045680; __gads=ID=92b58ed9ed58d147-221917af11ca0021:T=1625045679:RT=1625045679:S=ALNI_MYnQToDW3kOUClBGEzULNjeyAqOtg",
					"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
				},
				data: {
					'url':'https://www.instagram.com/'+ username,
					'action': 'story',
					'token': token
				}
			}
		axios.post('https://www.instagramsave.com/system/action.php',qs.stringify(config.data), { headers: config.headers })
		.then(({ data }) => {
		resolve(data.medias)
		   })
		})
	.catch(reject)
	})
}




class SaveTube {
  constructor() {
    this.ky = 'C5D58EF67A7584E4A29F6C35BBC4EB12'
    this.m = /^((?:https?:)?\/\/)?((?:www|m|music)\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?([a-zA-Z0-9_-]{11})/
    this.is = axios.create({
      headers: {
        'content-type': 'application/json',
        'origin': 'https://yt.savetube.me',
        'user-agent': 'Mozilla/5.0 (Android 15; Mobile)'
      }
    })
  }

  async decrypt(enc) {
    const buf = Buffer.from(enc, 'base64')
    const key = Buffer.from(this.ky, 'hex')
    const iv = buf.slice(0, 16)
    const data = buf.slice(16)

    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
    const decrypted = Buffer.concat([
      decipher.update(data),
      decipher.final()
    ])

    return JSON.parse(decrypted.toString())
  }

  async getCdn() {
    const res = await this.is.get("https://media.savetube.vip/api/random-cdn")
    return { status: true, data: res.data.cdn }
  }

  async download(url) {
    const id = url.match(this.m)?.[3]
    if (!id) throw "Invalid YouTube URL"

    const cdn = await this.getCdn()
console.log('CDN:', cdn.data)
console.log('INFO URL:', `https://${cdn.data}/v2/info`)
    
    
    const info = await this.is.post(`https://${cdn.data}/v2/info`, {
      url: `https://www.youtube.com/watch?v=${id}`
    })

    const dec = await this.decrypt(info.data.data)

    const dl = await this.is.post(`https://${cdn.data}/download`, {
      id,
      downloadType: 'audio',
      quality: '128',
      key: dec.key
    })

    return {
      success: true,
      downloadUrl: dl.data.data.downloadUrl,
      title: dec.title,
      duration: dec.duration,
      thumbnail: dec.thumbnail
    }
  }
}




async function animeScrape(query) {
    try {
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "text/html,application/xhtml+xml",
            "Referer": "https://www.google.com/"
        }

        let search

        // ✅ DEBUG DI SINI (REQUEST UTAMA)
        try {
            search = await axios.get(
                `https://s12.nontonanimeid.boats/?s=${encodeURIComponent(query)}`,
                { headers }
            )
        } catch (e) {
            return {
                error: "DEBUG",
                debug: {
                    status: e.response?.status,
                    data: e.response?.data?.slice(0, 500)
                }
            }
        }

        let $ = cheerio.load(search.data)

        let results = []

        $(".bs").each((i, el) => {
            results.push({
                title: $(el).find("a").attr("title"),
                link: $(el).find("a").attr("href"),
                thumb: $(el).find("img").attr("src")
            })
        })

        if (!results.length) {
            return { error: "Anime tidak ditemukan / selector salah" }
        }

        let first = results[0]

        // ✅ DEBUG DETAIL JUGA
        let detail
        try {
            detail = await axios.get(first.link, { headers })
        } catch (e) {
            return {
                error: "DEBUG DETAIL",
                debug: {
                    status: e.response?.status,
                    data: e.response?.data?.slice(0, 500)
                }
            }
        }

        let $$ = cheerio.load(detail.data)

        let title = $$("h1.entry-title").text().trim()
        let desc = $$(".entry-content p").first().text().trim()
        let iframe = $$("iframe").attr("src")

        return {
            title: title || first.title,
            desc: desc || "-",
            thumb: first.thumb,
            url: first.link,
            video: iframe || null
        }

    } catch (e) {
        return { error: e.message }
    }
}



// stalk

const IG_SIGNING_KEY_HEX = "792525efde6d921d6055a5d62dcebd39c8b5364e99fa87c5adf0e89391266d9c"
const IG_TS_BASELINE = 1773148641059
const IG_API_BASE = "https://api-wh.fastdl.app/api/v1/instagram"
const IG_CORS_PROXY = "https://cors.siputzx.my.id/"

async function igCallEndpoint(endpoint, body) {
  const ts = Date.now()
  const key = Buffer.from(IG_SIGNING_KEY_HEX, "hex")
  const _s = crypto.createHmac("sha256", key).update(JSON.stringify(body) + ts).digest("hex")
  const payload = { ...body, ts, _ts: IG_TS_BASELINE, _tsc: 0, _sv: 2, _s }

  const res = await fetch(`${IG_CORS_PROXY}${IG_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "origin": "https://fastdl.app",
      "referer": "https://fastdl.app/",
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`${endpoint} HTTP ${res.status}: ${errText.slice(0, 100)}`)
  }
  return await res.json()
}

function igCleanUsername(raw) {
  if (!raw) return null
  return String(raw)
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "")
    .trim()
}

async function stalkInstagram(usernameRaw) {
  const username = igCleanUsername(usernameRaw)
  if (!username) throw new Error("Username kosong / invalid")
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(username)) {
    throw new Error("Username format invalid (alphanumeric + . _ only)")
  }

  const [profileRes, userInfoRes, storiesRes] = await Promise.all([
    igCallEndpoint("profile", { username }).catch(e => ({ error: e.message })),
    igCallEndpoint("userInfo", { username }).catch(e => ({ error: e.message })),
    igCallEndpoint("stories", { username }).catch(e => ({ error: e.message }))
  ])

  const u = userInfoRes?.result?.[0]?.user || {}
  const p = profileRes?.result || {}
  const stories = Array.isArray(storiesRes?.result) ? storiesRes.result : []

  return {
    username: u.username || p.username || username,
    fullName: u.full_name || p.full_name || null,
    bio: u.biography || p.biography || null,
    isVerified: Boolean(u.is_verified ?? p.is_verified),
    isPrivate: Boolean(u.is_private ?? p.is_private),
    isBusiness: Boolean(u.is_business),
    category: u.category || p.category || null,
    followers: u.follower_count ?? null,
    following: u.following_count ?? null,
    postsCount: u.media_count ?? null,
    profilePic: u.profile_pic_url || p.profile_pic_url || null,
    profilePicHd: u.hd_profile_pic_url_info?.url || u.profile_pic_url_hd || null,
    externalUrl: u.external_url || p.external_url || null,
    userId: u.id || u.pk || p.id || null,
    activeStoriesCount: stories.length
  }
}

async function stalkTiktok(username) {
  username = String(username).replace(/^@/, "").trim()
  const html = await fetch(`https://www.tiktok.com/@${encodeURIComponent(username)}`, {
    headers: {
      authority: "www.tiktok.com",
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": "Android",
      "user-agent": "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"
    }
  }).then(a => a.text())

  const match =
    html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/) ||
    html.match(/<script id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/)
  if (!match) return null

  const json = JSON.parse(match[1])
  const scope = json.__DEFAULT_SCOPE__ || json.DEFAULT_SCOPE
  const detail = scope?.["webapp.user-detail"] || scope?.["webapp.reflow.profile.initial"]
  const userInfo = detail?.userInfo

  let u, s
  if (userInfo?.user) {
    u = userInfo.user
    s = userInfo.stats || userInfo.statsV2 || {}
  } else if (json.UserModule?.users) {
    const id = Object.keys(json.UserModule.users)[0]
    u = json.UserModule.users[id]
    s = json.UserModule.stats?.[id] || {}
  } else {
    return null
  }

  return {
    username: u.uniqueId || username,
    nickname: u.nickname || "",
    userId: u.id || null,
    verified: !!u.verified,
    privateAccount: !!u.privateAccount,
    region: u.region || null,
    signature: u.signature || "",
    bioLink: u.bioLink?.link || null,
    avatar: {
      thumb: u.avatarThumb || null,
      larger: u.avatarLarger || null
    },
    stats: {
      followers: Number(s.followerCount) || 0,
      following: Number(s.followingCount) || 0,
      hearts: Number(s.heartCount ?? s.heart) || 0,
      videos: Number(s.videoCount) || 0
    },
    profileUrl: `https://www.tiktok.com/@${u.uniqueId || username}`
  }
}


async function stalkRoblox(username) {
    const search = await axios.get(
        `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`
    )

    const user = search.data.data?.[0]
    if (!user) throw new Error('User tidak ditemukan')

    const userId = user.id

    const [
        profile,
        avatar,
        friends,
        followers,
        following,
        groups,
        badges,
        premium,
        presence
    ] = await Promise.allSettled([
        axios.get(`https://users.roblox.com/v1/users/${userId}`),

        axios.get(
            `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=352x352&format=Png`
        ),

        axios.get(`https://friends.roblox.com/v1/users/${userId}/friends/count`),

        axios.get(`https://friends.roblox.com/v1/users/${userId}/followers/count`),

        axios.get(`https://friends.roblox.com/v1/users/${userId}/followings/count`),

        axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`),

        axios.get(`https://badges.roblox.com/v1/users/${userId}/badges?limit=100&sortOrder=Asc`),

        axios.get(`https://premiumfeatures.roblox.com/v1/users/${userId}/validate-membership`),

        axios.post(
            'https://presence.roblox.com/v1/presence/users',
            {
                userIds: [userId]
            }
        )
    ])

    const getValue = (res, fallback = null) =>
        res.status === 'fulfilled'
            ? res.value.data
            : fallback

    const p = getValue(profile, {})
    const a = getValue(avatar, {})
    const fr = getValue(friends, {})
    const fo = getValue(followers, {})
    const fg = getValue(following, {})
    const gr = getValue(groups, {})
    const bd = getValue(badges, {})
    const pm = premium.status === 'fulfilled'
        ? premium.value.data
        : false

    const pr = getValue(presence, {})

    const presenceData = pr.userPresences?.[0] || {}

    const statusMap = {
        0: 'Offline',
        1: 'Online',
        2: 'In Game',
        3: 'In Studio'
    }

    return {
        id: userId,
        username: user.name,
        displayName: user.displayName,
        verified: user.hasVerifiedBadge,

        description: p.description,
        created: p.created,
        banned: p.isBanned,

        avatar: a.data?.[0]?.imageUrl,

        friends: fr.count || 0,
        followers: fo.count || 0,
        following: fg.count || 0,

        premium: pm === true,

        groups: gr.data?.length || 0,

        badges: bd.data?.length || 0,

        status:
            statusMap[presenceData.userPresenceType] ||
            'Unknown',

        location:
            presenceData.lastLocation ||
            'Tidak diketahui'
    }
}


async function stickerlySearch(keyword = 'anime') {
    try {
        const res = await axios.post(
            'https://api.sticker.ly/v4/stickerPack/smartSearch',
            {
                keyword,
                enabledKeywordSearch: true,
                filter: {
                    extendSearchResult: false,
                    sortBy: 'RECOMMENDED',
                    languages: ['ALL'],
                    minStickerCount: 5,
                    searchBy: 'ALL',
                    stickerType: 'ALL',
                },
            },
            {
                headers: {
                    'User-Agent':
                        'androidapp.stickerly/3.31.0 (M2006C3LG; U; Android 29; in-ID; id;)',
                    'Content-Type': 'application/json',
                },
            }
        )

        const packs = res.data?.data || []

        return packs.map(v => ({
            title: v.name,
            author: v.authorName,
            stickerCount: v.stickerCount,
            url: v.shareUrl
        }))

    } catch (err) {
        console.log(err)
        throw new Error('Gagal mencari sticker pack')
    }
}

async function stickerlyDownload(url) {
    try {
        const match = url.match(/sticker\.ly\/s\/([A-Z0-9]+)/i)
        if (!match) throw new Error('URL tidak valid')

        const packId = match[1]

        const res = await axios.get(
            `https://api.sticker.ly/v4/stickerPack/${packId}`,
            {
                params: { needRelation: true },
                headers: {
                    'User-Agent':
                        'androidapp.stickerly/3.31.0 (M2006C3LG; U; Android 29; in-ID; id;)'
                }
            }
        )

        const data = res.data

        return {
            title: data.name,
            author: data.authorName,
            total: data.stickerCount,
            stickers: data.resourceFiles?.map(v => v.url) || [],
            thumbnail: data.trayResourceUrl
        }

    } catch (err) {
        console.log(err)
        throw new Error('Gagal download sticker pack')
    }
}


/* ===============================
   FUNCTION - REMOVE BACKGROUND
================================ */

function removeBackground(encodedImage, title = 'image.jpg') {
  return new Promise((resolve, reject) => {
    const https = require('https')
    const payload = JSON.stringify({ encodedImage, title, mimeType: 'image/jpeg' })
    const options = {
      hostname: 'background-remover.com',
      path: '/removeImageBackground',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'Mozilla/5.0 (Android 14; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0',
        'Referer': 'https://background-remover.com/upload',
        'Accept': '*/*',
        'Origin': 'https://background-remover.com',
      },
    }
    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const raw = Buffer.concat(chunks)
        if (res.statusCode !== 200) return reject(new Error(`BG API ${res.statusCode}`))
        const ct = res.headers['content-type'] || ''
        if (ct.includes('image/')) { resolve({ _rawBuffer: raw }); return }
        try { resolve(JSON.parse(raw.toString())) }
        catch { resolve({ result: raw.toString() }) }
      })
      res.on('error', reject)
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

function saveBase64Image(data, outputPath) {
  const fs = require('fs')
  const b64 = data.replace(/^data:[^;]+;base64,/, '').trim()
  fs.writeFileSync(outputPath, Buffer.from(b64, 'base64'))
}



async function translate(text, to, from = 'auto') {
  const axios = require('axios')
  
  if (!text || !to) {
    return { 
      success: false, 
      message: 'Teks atau kode bahasa tujuan tidak boleh kosong' 
    }
  }

  try {
    const { data } = await axios.get('https://translate.googleapis.com/translate_a/single', {
      params: {
        client: 'gtx',
        sl: from,
        tl: to,
        dt: 't',
        q: text
      }
    })

    if (!data || !data[0]) {
      return { 
        success: false, 
        message: 'API merespons tapi data tidak tersedia' 
      }
    }

    const result = data[0]?.map(s => s?.[0]).filter(Boolean).join('')
    const detectedLang = data[2] || from

    if (!result) {
      return { 
        success: false, 
        message: 'Terjemahan gagal diproses' 
      }
    }

    return { 
      success: true,
      result, 
      detectedLang 
    }

  } catch (error) {
    let errorMsg = 'Gagal menghubungi layanan terjemahan'
    
    if (error.response?.status) {
      errorMsg = `API Error (${error.response.status}): ${error.response.data?.message || 'Unknown'}`
    } else if (error.message) {
      errorMsg = String(error.message)
    }
    
    return { 
      success: false, 
      message: errorMsg
    }
  }
}

module.exports = { 
  tiktokSearchVideo,
  tiktokDownloaderVideo,
  tiktokDownloaderAudio,
  tiktokdl,
  igDownload,
  capcutDownload,
  pinterest,
  pinterest2,
  remini,
  mediafire,
  translate,
  removeBackground,
  toAudio,
  toPTT,
  toVideo,
  getLyrics,
  DinosaurusHD,
  Igstory,
  SaveTube,
  animeScrape,
  stalkInstagram,
  stalkTiktok,
  stalkRoblox,
  stickerlySearch,
  stickerlyDownload
};
