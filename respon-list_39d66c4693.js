const fs = require('fs');

/*function addResponList(groupID, key, response, isImage, imageData, _db) {
    const obj_add = {
        id: groupID,
        key: key,
        response: response,
        isImage: !!isImage,
        image_data: isImage ? imageData : null,
        caption: isImage ? response : null
    }
    _db.push(obj_add)
    fs.writeFileSync('./lib/list-message.json', JSON.stringify(_db, null, 2))
}*/
function addResponList(groupID, key, response, isImage, imageData, _db) {
  const obj_add = {
    id: groupID,
    key,
    response,
    isImage: !!isImage,
    image_data: isImage ? imageData : null,
    caption: isImage ? response : null
  }

  _db.push(obj_add)
  fs.writeFileSync('./lib/list-message.json', JSON.stringify(_db, null, 2))
}

async function sendResponList(m, _db, dino) {
  const from = m.chat
  const body = (m.body || '').toLowerCase()

  for (let x of _db) {

    if (x.id === from && x.key.toLowerCase() === body) {

      if (x.isImage && x.image_data) {
        const buffer = Buffer.from(x.image_data, 'base64')

        return dino.sendMessage(from, {
          image: buffer,
          caption: x.caption || x.response || ''
        }, { quoted: m })
      }

      return dino.sendMessage(from, {
        text: x.response
      }, { quoted: m })
    }
  }
}

function getDataResponList(groupID, key, _db) {
    let position = null
    Object.keys(_db).forEach((x) => {
        if (_db[x].id === groupID && _db[x].key === key) {
            position = x
        }
    })
    if (position !== null) {
        return _db[position]
    }
}

function isAlreadyResponList(groupID, key, _db) {
    let found = false
    Object.keys(_db).forEach((x) => {
        if (_db[x].id === groupID && _db[x].key === key) {
            found = true
        }
    })
    return found
}

/*async function sendResponList(m, _db, dino) {
    const from = m.chat
    const body = (m.body || '').toLowerCase()

    for (let x of _db) {
        if (x.id === from && x.key.toLowerCase() === body) {
            if (x.isImage && x.image_data) {
                const buffer = Buffer.from(x.image_data, 'base64')
                await dino.sendMessage(from, {
                    image: buffer,
                    caption: x.caption || ''
                }, { quoted: m })
            } else {
                await dino.sendMessage(from, { text: x.response }, { quoted: m })
            }
            break
        }
    }
}*/

function isAlreadyResponListGroup(groupID, _db) {
    let found = false
    Object.keys(_db).forEach((x) => {
        if (_db[x].id === groupID) {
            found = true
        }
    })
    return found
}

function delResponList(groupID, key, _db) {
    let position = null
    Object.keys(_db).forEach((x) => {
        if (_db[x].id === groupID && _db[x].key === key) {
            position = x
        }
    })

    if (position !== null) {
        _db.splice(position, 1)
        fs.writeFileSync('./lib/list-message.json', JSON.stringify(_db, null, 5))
    }
 }

function updateResponList(groupID, key, response, isImage, image_data, _db) {
    let position = null
    Object.keys(_db).forEach((x) => {
        if (_db[x].id === groupID && _db[x].key === key) {
            position = x
        }
    })

    if (position !== null) {
        _db[position].response = response
        _db[position].isImage = isImage

        if (isImage) {
            _db[position].image_data = image_data
            _db[position].caption = response
        } else {
            _db[position].image_data = null
            _db[position].caption = null
        }

        fs.writeFileSync('./lib/list-message.json', JSON.stringify(_db, null, 2))
    }
}

module.exports = {
    addResponList,
    delResponList,
    isAlreadyResponList,
    isAlreadyResponListGroup,
    sendResponList,
    updateResponList,
    getDataResponList
}
