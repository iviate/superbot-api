require('dotenv').config();
const fs = require('fs')

const hoursToSeconds = (hours) => hours * 60 * 60 * 1000

module.exports = function logFile(name, tableId) {
    const dirLog = './logs'
    if (!fs.existsSync(dirLog)) {
        fs.mkdirSync(dirLog);
    }

    const dir = `${dirLog}/` + (process.env.LOG_DIR || 'temp')
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    const access = fs.createWriteStream(
        `${dir}/${new Date().toISOString()}.${name}.${tableId}.log`,
    )
    process.stdout.write = process.stderr.write = access.write.bind(access)

    setTimeout(logFile, hoursToSeconds(3))
}

