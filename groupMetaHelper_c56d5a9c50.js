/**
 * Helper untuk get group metadata dengan caching dan error handling
 */

// Global cache untuk group metadata
if (!global.groupCache) {
  global.groupCache = new Map()
}

/**
 * Get group metadata dengan safe error handling dan caching
 * @param {Object} dino - WhatsApp connection object
 * @param {string} jid - Group JID
 * @returns {Promise<Object>} Group metadata
 */
async function getGroupMetaSafe(dino, jid) {
  // Check cache dulu
  const cached = global.groupCache.get(jid)
  if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 menit
    return cached.data
  }

  try {
    const metadata = await dino.groupMetadata(jid)
    
    // Cache hasil
    global.groupCache.set(jid, {
      data: metadata,
      timestamp: Date.now()
    })
    
    return metadata
  } catch (e) {
    console.error('[getGroupMetaSafe] error:', e.message)
    
    // Return dummy metadata jika gagal
    const dummy = {
      id: jid,
      subject: 'Unknown Group',
      subjectOwner: '',
      subjectTime: 0,
      creation: 0,
      owner: '',
      desc: '',
      descId: '',
      restrict: false,
      announce: false,
      participants: [],
      size: 0
    }
    
    return dummy
  }
}

/**
 * Clear group metadata cache
 * @param {string} jid - Group JID (optional, jika tidak ada clear semua)
 */
function clearGroupCache(jid = null) {
  if (jid) {
    global.groupCache.delete(jid)
  } else {
    global.groupCache.clear()
  }
}

/**
 * Update group cache manual
 * @param {string} jid - Group JID
 * @param {Object} metadata - Group metadata
 */
function updateGroupCache(jid, metadata) {
  global.groupCache.set(jid, {
    data: metadata,
    timestamp: Date.now()
  })
}

// Set ke global agar bisa diakses dari mana saja
global.getGroupMetaSafe = getGroupMetaSafe
global.clearGroupCache = clearGroupCache
global.updateGroupCache = updateGroupCache

module.exports = {
  getGroupMetaSafe,
  clearGroupCache,
  updateGroupCache
}
