const { createLogger, transports, format } = require('winston')

const logger = createLogger({
    transports: [
        new transports.File({
            filename: '/var/log/reminder-server.log',
            level: process.env.FILE_LOG_LEVEL,
            format: format.combine(format.timestamp(), format.json())
        }),
        new transports.Console({
            level: process.env.CONSOLE_LOG_LEVEL,
            format: format.combine(format.timestamp(), format.json())
        })
    ]
})

module.exports = logger