'use strict'

const { pathToFileURL } = require('url')
const path = require('path')
const fs = require('fs')

let _cache = null

function findBaileysDir() {
    const candidates = [
        path.resolve(__dirname, '../node_modules/@whiskeysockets/baileys'),
        path.resolve(process.cwd(), 'node_modules/@whiskeysockets/baileys'),
        '/home/container/node_modules/@whiskeysockets/baileys'
    ]

    for (const c of candidates) {
        if (fs.existsSync(c)) return c
    }

    throw new Error('[baileys.js] Tidak bisa menemukan @whiskeysockets/baileys di node_modules')
}

async function loadBaileys() {
    if (_cache) return _cache

    const baileysDir = findBaileysDir()

    let entry = 'lib/index.js'

    const pkgPath = path.join(baileysDir, 'package.json')
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
        entry =
            pkg.exports?.['.']?.import ??
            pkg.exports?.['.']?.default ??
            pkg.module ??
            pkg.main ??
            entry
    }

    const entryAbs = path.resolve(baileysDir, entry)
    const entryURL = pathToFileURL(entryAbs).href

    const mod = await import(entryURL)

    const merged = { ...mod, ...(mod.default || {}) }

    // makeInMemoryStore kadang tidak di-export di fork tertentu — buat stub sederhana
    if (!merged.makeInMemoryStore) {
        console.warn('[baileys.js] makeInMemoryStore fallback (stub)')
        merged.makeInMemoryStore = () => ({
            bind: () => {},
            chats: { all: () => [] },
            contacts: {},
            messages: {},
            writeToFile: () => {},
            readFromFile: () => {},
        })
    }

    _cache = merged
    return _cache
}

module.exports = loadBaileys