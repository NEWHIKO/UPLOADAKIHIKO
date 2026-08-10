const path = require('path')

const conns = new Map()
let _nextId = 1

const conn = {
    decodeJid(jid) {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            const [user, server] = jid.split('@')
            return user.split(':')[0] + '@' + server
        }
        return jid
    }
}

function getSessionPath(username, phoneNumber) {
    return path.join(__dirname, '..', 'sessions', username || 'default', String(phoneNumber))
}

function addConnection(sock) {
    const id = _nextId++
    conns.set(id, sock)
    return id
}

function removeConnection(id) {
    return conns.delete(id)
}

function findByJid(jid) {
    for (const [id, sock] of conns.entries()) {
        const sockJid = sock?.user?.id
        if (sockJid && conn.decodeJid(sockJid) === jid) return { id, sock }
    }
    return null
}

module.exports = { conns, conn, getSessionPath, addConnection, removeConnection, findByJid }
