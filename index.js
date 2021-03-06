const https = require('https')
const Discord = require('discord.js')
const schedule = require('node-schedule')
//const secret = require('./secret.json')
const client = new Discord.Client();
const fs = require('fs');

client.on('ready', () => {
    console.log(`Logged in succesfully as ${client.user.tag}`)
    var today = new Date(Date.now())

    fillQuests(today)
})

/**
 * 
 * @param {Date} startDate Start date
 */
function fillQuests(startDate) {
    var endDate = new Date(startDate.getTime())
    endDate.setMonth(endDate.getMonth() + 1)
    https.get(`https://clients6.google.com/calendar/v3/calendars/pso2.schedule@gmail.com/events?calendarId=pso2.schedule%40gmail.com&singleEvents=true&timeZone=Europe%2FMadrid&maxAttendees=1&maxResults=250&sanitizeHtml=true&timeMin=${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()}T00%3A00%3A00%2B02%3A00&timeMax=${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}T00%3A00%3A00%2B02%3A00&key=AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs`, (res) => {
        var rawData = ''
        res.on('data', (chunk) => {
            rawData += chunk
        })
        //fs.readFile('./test.json', 'utf8', (err, rawData) => {
        res.on('end', () => {
            fs.writeFile('./res.json', rawData, 'utf8', () => { })
            const cal = JSON.parse(rawData)
            var i
            for (i = 0; i < cal.items.length; i++) {
                const event = cal.items[i];
                var date = new Date(Date.parse(event.start.dateTime))
                var remind = new Date(date.getTime()).setMinutes(date.getMinutes() - 30)
                if (event["description"]) {
                    var description = String(event["description"]).replace(/<[^>]*>|\n|\r|\ \ /gi, (x) => {
                        switch (x[1]) {
                            case '/':
                                switch (x[2]) {
                                    case 'p':
                                        return '\n'
                                    case 'b':
                                        return '**'
                                    case 'a':
                                        return ''
                                    default:
                                        return x
                                }
                            case 'a':
                            case 'p':
                                return '';
                            case 'b':
                                switch (x[2]) {
                                    case 'r':
                                        return '\n'
                                    default:
                                        return '**'
                                }
                            case '\n':
                            case '\r':
                                return ''
                            default:
                                return x
                        }
                    })
                    description = description.replace(/\s\s|[\n|\s]+$/gi, '')
                    console.log((i + 1) + " " + description)
                    schedule.scheduleJob(remind, () => {
                        sendquest(date, event["summary"], description)
                    })
                } else {
                    console.log((i + 1) + " NO DESCRIPTION")
                    schedule.scheduleJob(remind, () => {
                        sendquest(date, event["summary"])
                    })
                }
            }
            console.log(`Scheduled ${i} events`)

            var resetTime = Date.parse(cal.items[cal.items.length - 1].end.dateTime)
            schedule.scheduleJob(resetTime, () => {
                fillQuests(resetTime)
            })
            console.log(`Will fetch calendar again at ${cal.items[cal.items.length - 1].end.dateTime}`)
        })
    })
}

/**
 * 
 * @param {Date} date
 * @returns {String}
 */
function emojiHour(date) {
    const emojiConvert = { 0: '0️⃣', 1: '1️⃣', 2: '2️⃣', 3: '3️⃣', 4: '4️⃣', 5: '5️⃣', 6: '6️⃣', 7: '7️⃣', 8: '8️⃣', 9: '9️⃣' }
    const hour = date.getHours()
    const minute = date.getMinutes()
    return `${emojiConvert[parseInt(hour / 10)]}${emojiConvert[hour % 10]}💠${emojiConvert[parseInt(minute / 10)]}${emojiConvert[minute % 10]}`
}


/**
 * 
 * @param {Date} date
 * @param {String} title 
 * @param {String} [description] 
 */
function sendquest(date, title, description) {
    if (description) {
        description = `\n${description}`
    } else {
        description = ''
    }
    client.channels.fetch(process.env.channelId).then((channel) => {
        channel.send(`${emojiHour(date)}\n**${title}**${description}`)
            .then(() => { console.log(`sent event ${title}`) })
            .catch(console.error)
    }).catch(console.error)
}

client.login(process.env.BOT_TOKEN)