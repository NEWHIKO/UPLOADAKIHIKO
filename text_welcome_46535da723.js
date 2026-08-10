const fs = require("fs");
const path = "./lib/database/text_welcome.json";

function load() {
    return JSON.parse(fs.readFileSync(path));
}

function save(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function setWelcome(chatId, text) {
    const db = load();
    db.welcome[chatId] = text;
    save(db);
}

function getWelcome(chatId) {
    const db = load();
    return db.welcome[chatId] || null;
}

function setBye(chatId, text) {
    const db = load();
    db.bye[chatId] = text;
    save(db);
}

function getBye(chatId) {
    const db = load();
    return db.bye[chatId] || null;
}

module.exports = { setWelcome, getWelcome, setBye, getBye };