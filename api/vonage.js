const moment = require('moment')
const Vonage = require('@vonage/server-sdk')
const { CALENDAR_POLL_INTERVAL, REDIAL_DELAY_MILLISECONDS, DEFAULT_NOFITY_MILLISECONDS, FROM_NUMBER_VONAGE } = require('../consts/consts')
const { getCurrentDiff } = require('../utils')
const logger = require('../config/logger')

const vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
    applicationId: process.env.VONAGE_APPLICATION_ID,
    privateKey: process.env.VONAGE_PRIVATE_KEY_PATH,
  }, { debug: process.env.DEBUG_MODE })




  const makeVonageSpeechToTextCall = (to, from, event) => {
    moment.locale('he')
    const formatedText = moment(event.start.dateTime).format(`שלום. זאת תזכורת. ביום dddd בשעה LT יש ${event.summary}`)
    const textMessage = `שלום, זאת תזכורת ל-${event.summary} ב${moment(event.start.dateTime).format('dddd LT')}`
    logger.info(`${new Date()} -- MAKE_CALL:${to} -- ${formatedText}`)
  
    vonage.calls.create({
      to: [{
        type: 'phone',
        number: to
      }],
      from: {
        type: 'phone',
        number: from,
      },
      ncco: [{
        "action": "talk",
        "text": formatedText,
        "loop": 2,
        "level": 1,
        "language": "he-IL",
        "voiceName": "Carmit"
      }]
    }, (error, response) => {
      if (error) logger.error(`CALL ERROR - ${JSON.stringify(error)}`)
      if (response) {
        logger.info(`${new Date()} -- CALLING:${to} -- ${formatedText}`)
  
        let callPollingInternal = setInterval(() => {
          vonage.calls.get(response.uuid, (err, res) => {
            if (err) { logger.error(`${JSON.stringify(err)}`); }
            
            if (res.status == "failed" || res.status == "completed") {
              logger.error(`CALL FAILED - ${JSON.stringify(res)}`)
              clearInterval(callPollingInternal)
            }
            const currentDiff = getCurrentDiff(event)
            
            if (["rejected", "busy", "cancelled", " timeout"].includes(res.status) && currentDiff > 1) {
              // send message
              const messageOpts = {
                "type": "unicode"
              }

              vonage.message.sendSms(from=FROM_NUMBER_VONAGE, to=to, textMessage, messageOpts, (err, responseData) => {
                if (err) {
                    logger.error(JSON.stringify(err));
                } else {
                    if(responseData.messages[0]['status'] === "0") {
                      logger.info( `${new Date()} -- MESSAGE_SENT:${to} --MESSAGE_TEXT:${textMessage}`)
                    } else {
                        console.error(`Message failed with error: ${responseData.messages[0]['error-text']}`);
                    }
                }
              })

                vonage.calls.create({
                  to: [{
                    type: 'phone',
                    number: to
                  }],
                  from: {
                    type: 'phone',
                    number: from
                  },
                  ncco: [{
                    "action": "talk",
                    "text": formatedText,
                    "loop": 2,
                    "level": 1,
                    "language": "he-IL",
                    "voiceName": "Carmit"
                  }]
                })
              clearInterval(callPollingInternal)
            }
          });
        }, 60000)
      }
    })
  }

  module.exports = {
      makeVonageSpeechToTextCall
  }