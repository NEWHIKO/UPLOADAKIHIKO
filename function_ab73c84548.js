const fs = require('fs');
const util = require('util');
const Jimp = require('jimp');
const axios = require('axios');
const chalk = require('chalk');
const crypto = require('crypto');
const FileType = require('file-type');
const moment = require('moment-timezone');
const { defaultMaxListeners } = require('stream');
const { sizeFormatter } = require('human-readable');
// proto dll dari baileys sudah tidak dipakai langsung di file ini
const pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'.split('');

const unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000)

const generateMessageTag = (epoch) => {
    let tag = (0, unixTimestampSeconds)().toString();
    if (epoch)
        tag += '.--' + epoch;
    return tag;
}

const processTime = (timestamp, now) => {
	return moment.duration(now - moment(timestamp * 1000)).asSeconds()
}

const webApi = (a, b, c, d, e, f) => {
	const hasil = a + b + c + d + e + f;
	return hasil;
}

const getBuffer = async (url, options = {}) => {
  try {
    const res = await axios({
      method: "get",
      url,
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Request': 1
      },
      ...options,
      responseType: 'arraybuffer'
    })
    return res.data 
  } catch (err) {
    throw err
  }
}

const fetchJson = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'GET',
      url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
      },
      ...options
    })
    return res.data
  } catch (err) {
    throw err
  }
}

const runtime = function(seconds = process.uptime()) {
	seconds = Number(seconds);
	var d = Math.floor(seconds / (3600 * 24));
	var h = Math.floor(seconds % (3600 * 24) / 3600);
	var m = Math.floor(seconds % 3600 / 60);
	var s = Math.floor(seconds % 60);
	var dDisplay = d > 0 ? d + (d == 1 ? "d " : "𝗵𝗮𝗿 ") : "";
	var hDisplay = h > 0 ? h + (h == 1 ? "h " : "𝗷𝗮𝗺 ") : "";
	var mDisplay = m > 0 ? m + (m == 1 ? "m " : "𝗺𝗲𝗻𝗶𝘁 ") : "";
	var sDisplay = s > 0 ? s + (s == 1 ? "s" : " 𝗱𝗲𝘁𝗶𝗸") : "";
	return dDisplay + hDisplay + mDisplay + sDisplay;
}

const clockString = (ms) => {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'))
}

const getTime = (format, date) => {
	if (date) {
		return moment(date).locale('id').format(format)
	} else {
		return moment.tz('Asia/Jakarta').locale('id').format(format)
	}
}

const capital = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const formatDate = (n, locale = 'id') => {
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

const tanggal = (numer) => {
	myMonths = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
	myDays = ['Minggu','Senin','Selasa','Rabu','Kamis','Jum’at','Sabtu']; 
	var tgl = new Date(numer);
	var day = tgl.getDate()
	bulan = tgl.getMonth()
	var thisDay = tgl.getDay(),
	thisDay = myDays[thisDay];
	var yy = tgl.getYear()
	var year = (yy < 1000) ? yy + 1900 : yy; 
	const time = moment.tz('Asia/Jakarta').format('DD/MM HH:mm:ss')
	let d = new Date
	let locale = 'id'
	let gmt = new Date(0).getTime() - new Date('1 January 1970').getTime()
	let weton = ['Pahing', 'Pon','Wage','Kliwon','Legi'][Math.floor(((d * 1) + gmt) / 84600000) % 5]
	return`${thisDay}, ${day} - ${myMonths[bulan]} - ${year}`
}

const formatp = sizeFormatter({
    std: 'JEDEC', //'SI' = default | 'IEC' | 'JEDEC'
    decimalPlaces: 2,
    keepTrailingZeroes: false,
    render: (literal, symbol) => `${literal} ${symbol}B`,
})

const jsonformat = (string) => {
    return JSON.stringify(string, null, 2)
}

const reSize = async (image, ukur1 = 100, ukur2 = 100) => {
	return new Promise(async(resolve, reject) => {
		try {
			const read = await Jimp.read(image);
			const result = await read.resize(ukur1, ukur2).getBufferAsync(Jimp.MIME_JPEG)
			resolve(result)
		} catch (e) {
			reject(e)
		}
	})
}

const toHD = async (image) => {
	return new Promise(async(resolve, reject) => {
		try {
			const read = await Jimp.read(image);
			const newWidth = read.bitmap.width * 4;
			const newHeight = read.bitmap.height * 4;
			const result = await read.resize(newWidth, newHeight).getBufferAsync(Jimp.MIME_JPEG)
			resolve(result)
		} catch (e) {
			reject(e)
		}
	})
}

const logic = (check, inp, out) => {
	if (inp.length !== out.length) throw new Error('Input and Output must have same length')
	for (let i in inp)
		if (util.isDeepStrictEqual(check, inp[i])) return out[i]
	return null
}

const generateProfilePicture = async (buffer) => {
	const jimp = await Jimp.read(buffer)
	const min = jimp.getWidth()
	const max = jimp.getHeight()
	const cropped = jimp.crop(0, 0, min, max)
	return {
		img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
		preview: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG)
	}
}

async function toIDR(x) {
x = x.toString()
var pattern = /(-?\d+)(\d{3})/
while (pattern.test(x))
x = x.replace(pattern, "$1.$2")
return x
}

const bytesToSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const checkBandwidth = async () => {
	let ind = 0;
	let out = 0;
	for (let i of await require('node-os-utils').netstat.stats()) {
		ind += parseInt(i.inputBytes);
		out += parseInt(i.outputBytes);
	}
	return {
		download: bytesToSize(ind),
		upload: bytesToSize(out),
	}
}

const getSizeMedia = async (path) => {
    return new Promise((resolve, reject) => {
        if (/http/.test(path)) {
            axios.get(path).then((res) => {
                let length = parseInt(res.headers['content-length'])
                let size = bytesToSize(length, 3)
                if(!isNaN(length)) resolve(size)
            })
        } else if (Buffer.isBuffer(path)) {
            let length = Buffer.byteLength(path)
            let size = bytesToSize(length, 3)
            if(!isNaN(length)) resolve(size)
        } else {
            reject('error gatau apah')
        }
    })
}

const parseMention = (text = '') => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
}

const getGroupAdmins = (participants) => {
        let admins = []
        for (let i of participants) {
            i.admin === "superadmin" ? admins.push(i.id) :  i.admin === "admin" ? admins.push(i.id) : ''
        }
        return admins || []
}

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

const generateAuthToken = (size) => {
    return crypto.randomBytes(size).toString('hex').slice(0, size);
}

const cekMenfes = (tag, nomer, db_menfes) => {
	let x1 = false
	Object.keys(db_menfes).forEach((i) => {
		if (db_menfes[i].id == nomer){
			x1 = i
		}
	})
	if (x1 !== false) {
		if (tag == 'id'){
			return db_menfes[x1].id
		}
		if (tag == 'teman'){
			return db_menfes[x1].teman
		}
	}
	if (x1 == false) {
		return null
	}
}

function format(...args) {
	return util.format(...args)
}

function generateToken() {
  let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*';
  let token = '';
  for (let i = 0; i < 8; i++) {
    let randomIndex = Math.floor(Math.random() * characters.length);
    token += characters.charAt(randomIndex);
  }
  return token;
}

function batasiTeks(teks, batas) {
  if (teks.length <= batas) {
    return teks;
  } else {
    return teks.substring(0, batas) + '...';
  }
}

function randomText(len) {
    const result = [];
    for (let i = 0; i < len; i++) result.push(pool[Math.floor(Math.random() * pool.length)]);
    return result.join('');
}

function isEmoji(str) {
  const emojiRegex = /[\u{1F000}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F100}-\u{1F1FF}]/u;
  return emojiRegex.test(str);
}

function readFileTxt(file) {
    return new Promise((resolve, reject) => {
        const data = fs.readFileSync(file, 'utf8');
        const array = data.toString().split('\n') ;
        const random = array[Math.floor(Math.random() * array.length)];
        resolve(random.replace('\r', ''));
    })
}

function readFileJson(file) {
    return new Promise((resolve, reject) => {
        const jsonData = JSON.parse(fs.readFileSync(file));
        const index = Math.floor(Math.random() * jsonData.length);
        const random = jsonData[index];
        resolve(random);
    })
}

async function getTypeUrlMedia(url) {
	return new Promise(async (resolve, reject) => {
		try {
			const buffer = await axios.get(url, { responseType: 'arraybuffer' });
			const type = buffer.headers['content-type'] || (await FileType.fromBuffer(buffer.data)).mime
			resolve({ type, url })
		} catch (e) {
			reject(e)
		}
	})
}

function pickRandom(list) {
	return list[Math.floor(list.length * Math.random())]
}

async function getAllHTML(urls) {
  try {
    const htmlArr = [];
    for (const url of urls) {
      const response = await axios.get(url);
      htmlArr.push(response.data);
    }
    return htmlArr;
  } catch (error) {
    console.error(error);
  }
}


function msToTime(ms) {
  let h = Math.floor(ms / 3600000)
  let m = Math.floor(ms % 3600000 / 60000)
  let s = Math.floor(ms % 60000 / 1000)
  return `${h}h ${m}m ${s}s`
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 𝗙𝗨𝗡𝗖𝗧𝗜𝗢𝗡 𝗪𝗔𝗞𝗧𝗨
const time = moment.tz('Asia/Jakarta').format('HH:mm:ss');
const date = moment.tz('Asia/Jakarta').format('DD/MM/YYYY');
const time2 = moment.tz('Asia/Jakarta').format('HH:mm:ss');

let ucapanWaktu = "𝘀𝗲𝗹𝗮𝗺𝗮𝘁 𝗺𝗮𝗹𝗮𝗺 🌌";
let jam = parseInt(time2.split(":")[0]);

if (jam >= 3 && jam < 11) {
    ucapanWaktu = "𝘀𝗲𝗹𝗮𝗺𝗮𝘁 𝗽𝗮𝗴𝗶 🌅";
} else if (jam >= 11 && jam < 14) {
    ucapanWaktu = "𝘀𝗲𝗹𝗮𝗺𝗮𝘁 𝘀𝗶𝗮𝗻𝗴 🌤️";
} else if (jam >= 14 && jam < 18) {
    ucapanWaktu = "𝘀𝗲𝗹𝗮𝗺𝗮𝘁 𝘀𝗼𝗿𝗲 🌇";
} else {
    ucapanWaktu = "𝘀𝗲𝗹𝗮𝗺𝗮𝘁 𝗺𝗮𝗹𝗮𝗺 🌌";
}

const getWIBTime = () => {
  const date = new Date()
  const utc = date.getTime() + date.getTimezoneOffset() * 60000
  const wib = new Date(utc + 7 * 3600000)

  return wib.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

const timeWIB = getWIBTime()

const getWIBDayPasaran = () => {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 7 * 3600000);
  const days = ['𝗠𝗶𝗻𝗴𝗴𝘂', '𝗦𝗲𝗻𝗶𝗻', '𝗦𝗲𝗹𝗮𝘀𝗮', '𝗥𝗮𝗯𝘂', '𝗞𝗮𝗺𝗶𝘀', '𝗝𝘂𝗺𝗮𝘁', '𝗦𝗮𝗯𝘁𝘂'];
  const pasaran = ['𝗟𝗲𝗴𝗶', '𝗣𝗮𝗵𝗶𝗻𝗴', '𝗣𝗼𝗻', '𝗪𝗮𝗴𝗲', '𝗞𝗹𝗶𝘄𝗼𝗻'];
  const dayName = days[wib.getDay()];
  const start = new Date('1970-01-01T00:00:00+07:00');
  const daysSinceEpoch = Math.floor((wib - start) / (1000 * 60 * 60 * 24));
  const pasaranName = pasaran[daysSinceEpoch % 5];

  return `${dayName} ${pasaranName}`;
};
const hariPasaran = getWIBDayPasaran();

function toMs(time) {
    let jumlah = parseInt(time)
    let tipe = time.replace(jumlah, "")
    let ms = 0
    if (tipe == "d") ms = jumlah * 24 * 60 * 60 * 1000
    if (tipe == "h") ms = jumlah * 60 * 60 * 1000
    if (tipe == "m") ms = jumlah * 60 * 1000
    return ms
}

function msToTime(ms) {
let seconds = Math.floor((ms / 1000) % 60)
let minutes = Math.floor((ms / (1000 * 60)) % 60)
let hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
let days = Math.floor(ms / (1000 * 60 * 60 * 24))

return `${days}d ${hours}h ${minutes}m ${seconds}s`
}

const getWIBDateTime = () => {
  return new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}


const react = async (emoji) => {
    try {
        await dino.sendMessage(m.chat, {
            react: { text: emoji, key: m.key }
        })
    } catch (e) {
        if (e?.data === 429 || e?.message?.includes('rate')) {
            console.log('[React] Rate limit, skip react', emoji)
            return
        }
        console.log('[React] Error:', e?.message)
    }
}


function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
} 
    
function resolveTarget(m, lidToJid) {
  let target = null

  if (m.mentionedJid?.[0]) {
    target = lidToJid(m.mentionedJid[0])
  } else if (m.quoted) {
    target = lidToJid(m.quoted.sender)
  } else {
    target = m.sender
  }

  return target
}


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
function drawCircularTextTop(ctx, text, centerX, centerY, radius, badgeImage) {
  let fontSize = 72
  let strokeWidth = 3
  let strokeColor = '#000'
  let arcSpan = Math.PI * 0.7

  let textRadius = radius + 75
  let chars = text.split('')
  let n = chars.length
  let angleIncrement = n > 1 ? arcSpan / (n - 1) : 0
  let start = Math.PI / 2 + arcSpan / 2

  for (let i = 0; i < n; i++) {
    let char = chars[i]
    let angle = start - i * angleIncrement
    let x = centerX + Math.cos(angle) * textRadius
    let y = centerY + Math.sin(angle) * textRadius

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle - Math.PI / 2)
    ctx.lineWidth = strokeWidth
    ctx.strokeStyle = strokeColor
    ctx.strokeText(char, 0, 0)
    ctx.fillText(char, 0, 0)
    ctx.restore()
  }

  if (badgeImage) {
    let endAngle = start - (n - 1) * angleIncrement
    let badgeAngle = endAngle - angleIncrement
    let badgeSize = Math.round(fontSize * 0.9)
    let bx = centerX + Math.cos(badgeAngle) * textRadius
    let by = centerY + Math.sin(badgeAngle) * textRadius
    ctx.drawImage(badgeImage, bx - badgeSize / 2, by - badgeSize / 2, badgeSize, badgeSize)
  }
}


module.exports = { unixTimestampSeconds, generateMessageTag, processTime, webApi, getBuffer, fetchJson, runtime, clockString, sleep, isUrl, getTime, formatDate, tanggal, formatp, jsonformat, reSize, toHD, logic, generateProfilePicture, bytesToSize, checkBandwidth, getSizeMedia, parseMention, getGroupAdmins, readFileTxt, readFileJson, getHashedPassword, generateAuthToken, cekMenfes, generateToken, batasiTeks, randomText, isEmoji, getTypeUrlMedia, pickRandom, toIDR, capital, ucapanWaktu, getWIBTime, getWIBDayPasaran, toMs, msToTime, getWIBDateTime, react, getRandom, resolveTarget, delay, drawCircularTextTop };

let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update ${__filename}`))
	delete require.cache[file]
	require(file)
})