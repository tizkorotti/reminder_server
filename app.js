
require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const app = express()
const port = 8765

const { CALL_POLLING_INTERVAL,
        DEFAULT_NOFITY_MILLISECONDS,
        FROM_NUMBER_VONAGE } = require('./consts/consts')
const User = require('./models/user.model')
const Event = require('./models/event.model')
const { google } = require('googleapis');
const { makeVonageSpeechToTextCall } = require('./api/vonage')
const { getCurrentDiff } = require('./utils')
const logger = require('./config/logger')

const googleConfig = {
    cliendId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirect: 'http://vps-0d4df705.vps.ovh.ca:8764/google/callback'
}

function createConnection() {
    return new google.auth.OAuth2(
        googleConfig.cliendId,
        googleConfig.clientSecret,
        googleConfig.redirect 
    )
}

app.get('/', (req, res) => {
  res.send('Reminder server is up and running!')
})

app.listen(port, async () => {
  logger.info(`Reminder Server started on port: ${port}`)
  // connect to DB
  mongoose.connect(process.env.DB_CONNECT_URL, { useNewUrlParser: true, useUnifiedTopology: true }, async () => {
        logger.info('connected to DB')
    })
  // start polling calendars
  try {
    
    const auth = createConnection()
    const calendarOptions = {
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: 'Asia/Jerusalem'
    }
    //add tokens to the api so we have access to the account

    setInterval(async () => {
      logger.debug('polling...')
      users = await User.find({})
    
      for (const user of users) {
          try {
            logger.debug(`setting tokens for ${user.name}`)
            auth.setCredentials(user.tokens) 
          const calendar = google.calendar({version: 'v3', auth});

          const { data: { items: events }} = await calendar.events.list(calendarOptions)

          events.forEach(async event => {
            const start = event.start.dateTime || event.start.date
            const notifyBeforeEventTime = getCurrentDiff(event)  // gets the difference defined in the calendar
            const currentDiffToEventStart = new Date(start).getTime() - Date.now()
            logger.debug(`start: ${new Date(start)}, startTimeTS: ${new Date(start).getTime()}, now: ${Date.now()}, diff: ${currentDiffToEventStart}`)
            const isBeforeEventStartTime = currentDiffToEventStart > 0
            logger.debug(`Now: ${new Date(Date.now())}, notifyBeforeEventTime: ${notifyBeforeEventTime}`)
            logger.debug(`checking if event ${event.summary} is in call window: currentDiff: ${currentDiffToEventStart} isInWindow: ${currentDiffToEventStart <= notifyBeforeEventTime}, isBeforeEventStart: ${isBeforeEventStartTime > 0}`)
            if(currentDiffToEventStart <= notifyBeforeEventTime && isBeforeEventStartTime) {
              // check if has been called. If not mark as called in DB else continue
              calledEvent = await Event.findOne({ eventId: event.id })
              if (!calledEvent || calledEvent.start !== event.start.dateTime) {
                logger.info(`calling event for: ${user.name} - ${event.summary}`)
                makeVonageSpeechToTextCall(user.primaryNumber, FROM_NUMBER_VONAGE, event)
                // add called event to db
                await Event.update(
                  { eventId: event.id },
                  {
                    eventId: event.id,
                    userId: user.id,
                    start: event.start.dateTime,
                    end: event.end.dateTime
                  }, 
                  { upsert: true }
                )
              } else {
                logger.info(`${user.name} was called for ${event.id} - ${event.summary}`)
              }
            }
          })
          } // end of try 
          catch(e) {
            logger.error(`ERROR OCCURED: ${JSON.stringify(e)}`)
          }
      }
    }, CALL_POLLING_INTERVAL)
    
  } catch(err) {
        logger.error(`POLLING ERROR: ${JSON.stringify(err)}`)
  }
})