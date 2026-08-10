const { getDatabase } = require('../db');

/**
 * Cari dokumen user di MongoDB dan kembalikan LOKASI-nya (collection + filter + doc).
 * Dipakai oleh loadCustomConfig() dan idchCache untuk membaca/menulis ke dokumen
 * yang SAMA PERSIS tempat user ditemukan (tanpa membuat dokumen baru / ubah backend).
 *
 * @param {string} username
 * @returns {Promise<{collectionName:string, filter:Object, doc:Object}|null>}
 */
async function findUserDocLocation(username) {
    if (!username) return null;

    try {
        const database = await getDatabase();

        // 1. "users" collection (field username lalu name)
        try {
            const usersCol = database.collection('users');
            let doc = await usersCol.findOne({ username });
            if (doc) return { collectionName: 'users', filter: { _id: doc._id }, doc };
            doc = await usersCol.findOne({ name: username });
            if (doc) return { collectionName: 'users', filter: { _id: doc._id }, doc };
        } catch (e) {
            console.warn(`[findUserDocLocation] Error searching "users":`, e.message);
        }

        // 2. user_index → resolve collection
        try {
            const indexDoc = await database.collection('user_index').findOne({
                $or: [{ username }, { name: username }]
            });
            if (indexDoc?.collectionName) {
                const targetCol = database.collection(indexDoc.collectionName);
                let doc = await targetCol.findOne({ $or: [{ username }, { name: username }] });
                if (!doc) doc = await targetCol.findOne({});
                if (doc) {
                    return { collectionName: indexDoc.collectionName, filter: { _id: doc._id }, doc };
                }
            }
        } catch (e) {
            console.warn(`[findUserDocLocation] Error searching user_index:`, e.message);
        }

        // 3. Legacy per-user collection
        try {
            const doc = await database.collection(username).findOne({});
            if (doc) return { collectionName: username, filter: { _id: doc._id }, doc };
        } catch (e) {
            console.warn(`[findUserDocLocation] Error searching legacy:`, e.message);
        }

        return null;
    } catch (error) {
        console.error(`[findUserDocLocation] Error:`, error.message);
        return null;
    }
}

/**
 * Load custom config untuk user dari MongoDB.
 * Hanya field yang editable=true di configSchema yang dipakai.
 */
async function loadCustomConfig(username) {
    if (!username) return null;

    try {
        const location = await findUserDocLocation(username);
        const userDoc = location?.doc;

        if (!userDoc?.config) return null;

        // Validasi hanya field yang editable.
        // PENGECUALIAN: `idch` & `idchFrom` (editable:false / tidak di schema)
        // tetap di-load karena disimpan otomatis oleh bot (hasil resolve dari ch)
        // langsung di dalam config. `idchFrom` = link ch yang menghasilkan idch,
        // dipakai untuk deteksi perubahan ch.
        const { getConfigSchema } = require('../config');
        const configSchema = getConfigSchema();
        const ALWAYS_LOAD = ['idch', 'idchFrom'];
        const finalConfig = {};

        for (const [key, value] of Object.entries(userDoc.config)) {
            if (configSchema[key]?.editable || ALWAYS_LOAD.includes(key)) {
                finalConfig[key] = value;
            }
        }

        return Object.keys(finalConfig).length > 0 ? finalConfig : null;

    } catch (error) {
        console.error(`[loadCustomConfig] Error:`, error.message);
        return null;
    }
}

/**
 * Cek apakah sender adalah moderator berdasarkan conn.config.mods
 */
function isMod(conn, sender) {
    if (!conn?.config?.mods) return false;
    const phone = sender.split('@')[0].split(':')[0];
    return conn.config.mods.includes(phone);
}

/**
 * Ambil config value dari conn dengan fallback ke global
 */
function getConfig(conn, key, defaultValue = null) {
    if (conn?.config?.[key] !== undefined) return conn.config[key];
    if (global[key] !== undefined) return global[key];
    return defaultValue;
}

module.exports = loadCustomConfig;
module.exports.isMod = isMod;
module.exports.getConfig = getConfig;
module.exports.findUserDocLocation = findUserDocLocation;

/*const { getDatabase } = require('../db');

async function loadCustomConfig(username) {
    if (!username) {
        console.log('[loadCustomConfig] No username provided');
        return null;
    }

    try {
        const database = await getDatabase();

        // ── 1. Cari di unified "users" collection ──────────────────────────
        let userDoc = null;
        let foundIn = null;
        try {
            const usersCol = database.collection('users');
            // Backend findUserByUsername pakai field "username", bukan "name"
            userDoc = await usersCol.findOne({ username: username });
            if (userDoc) {
                foundIn = 'users';
                console.log(`[loadCustomConfig] Found in "users" (username field), hasConfig: ${!!userDoc.config}, configKeys: ${userDoc.config ? Object.keys(userDoc.config).join(',') : 'none'}`);
            } else {
                // Coba field "name" sebagai fallback
                userDoc = await usersCol.findOne({ name: username });
                if (userDoc) {
                    foundIn = 'users';
                    console.log(`[loadCustomConfig] Found in "users" (name field), hasConfig: ${!!userDoc.config}`);
                } else {
                    const count = await usersCol.countDocuments();
                    console.log(`[loadCustomConfig] Not found in "users" collection (total docs: ${count})`);
                }
            }
        } catch (e) {
            console.warn(`[loadCustomConfig] Error searching "users" collection:`, e.message);
        }

        // ── 2. Cari di user_index untuk resolve collection name ─────────────
        if (!userDoc) {
            try {
                const userIndexCol = database.collection('user_index');
                const indexDoc = await userIndexCol.findOne({
                    $or: [{ username: username }, { name: username }]
                });
                if (indexDoc?.collectionName) {
                    console.log(`[loadCustomConfig] Found in user_index, collectionName: ${indexDoc.collectionName}`);
                    const targetCol = database.collection(indexDoc.collectionName);
                    userDoc = await targetCol.findOne({ $or: [{ username }, { name: username }] })
                              || await targetCol.findOne({});
                    if (userDoc) foundIn = indexDoc.collectionName;
                }
            } catch (e) {
                console.warn(`[loadCustomConfig] Error searching user_index:`, e.message);
            }
        }

        // ── 3. Fallback ke legacy per-user collection ───────────────────────
        if (!userDoc) {
            try {
                const legacyCol = database.collection(username);
                userDoc = await legacyCol.findOne({});
                if (userDoc) {
                    foundIn = username;
                    console.log(`[loadCustomConfig] Found in legacy collection "${username}", hasConfig: ${!!userDoc.config}`);
                } else {
                    console.log(`[loadCustomConfig] Not found anywhere for user: ${username}`);
                }
            } catch (e) {
                console.warn(`[loadCustomConfig] Error searching legacy collection:`, e.message);
            }
        }

        // ── 3. Tidak ada user doc ───────────────────────────────────────────
        if (!userDoc) {
            console.log(`[loadCustomConfig] User not found: ${username}`);
            return null;
        }

        // ── 4. Cek apakah ada field config ─────────────────────────────────
        if (!userDoc.config) {
            console.log(`[loadCustomConfig] No custom config for user: ${username}`);
            return null;
        }

        const userConfig = userDoc.config;
        console.log(`[loadCustomConfig] Found config with keys:`, Object.keys(userConfig).join(', '));

        // ── 5. Validasi hanya field yang editable di schema ─────────────────
        const { getConfigSchema } = require('../config');
        const configSchema = getConfigSchema();

        const finalConfig = {};
        let appliedCount = 0;

        for (const [key, value] of Object.entries(userConfig)) {
            const schemaEntry = configSchema[key];

            if (!schemaEntry) {
                // Key tidak ada di schema — skip tapi jangan log warning (bisa field lama)
                continue;
            }

            if (!schemaEntry.editable) {
                // Field read-only — skip
                continue;
            }

            finalConfig[key] = value;
            appliedCount++;
        }

        if (appliedCount === 0) {
            console.log(`[loadCustomConfig] Config ada tapi tidak ada field editable untuk ${username}`);
            return null;
        }

        console.log(`[loadCustomConfig] ✅ Loaded ${appliedCount} custom config field(s) for ${username}:`, Object.keys(finalConfig).join(', '));
        return finalConfig;

    } catch (error) {
        console.error(`[loadCustomConfig] Error:`, error.message);
        return null;
    }
}


function isMod(conn, sender) {
    if (!conn?.config?.mods) return false;
    const phone = sender.split('@')[0].split(':')[0];
    return conn.config.mods.includes(phone);
}

function getConfig(conn, key, defaultValue = null) {
    if (conn?.config?.[key] !== undefined) return conn.config[key];
    if (global[key] !== undefined) return global[key];
    return defaultValue;
}

module.exports = loadCustomConfig;
module.exports.isMod = isMod;
module.exports.getConfig = getConfig;
*/