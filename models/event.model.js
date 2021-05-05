const mongoose = require('mongoose')

const EventSchema = mongoose.Schema({
    eventId: String,
    userId: String,
    start: String,
    end: String
})

// const EventSchema = mongoose.Schema({
//     kind: String,
//     etag: String,
//     id: String,
//     status: String,
//     htmlLink: String,
//     created: String,
//     updated: String,
//     summary: String,
//     creator: {
//         email: String,
//         self: Boolean
//     },
//     organizer: {
//         email: String,
//         self: Boolean
//     },
//     start: {
//         dateTime: String,
//         timeZone: String 
//     },
//     end: {
//         dateTime: String,
//         timeZone: String
//     },
//     iCalUID: String,
//     sequence: Number,
//     reminders: {
//         useDefault: Boolean
//     } 
// })

module.exports = mongoose.model('Events', EventSchema)