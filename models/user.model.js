const mongoose = require('mongoose')
// Schemas
const { EventSchema } = require('./event.model')

// token
const TokenSchema = mongoose.Schema({
    access_token: String,
    refresh_token: String,
    scope: String,
    token_type: String,
    id_token: String,
    // expiry_date: Number
})

// user
const UserSchema = mongoose.Schema({
    id: String,
    name: String,
    given_name: String,
    picture: String,
    locale: String,
    primaryNumber: String,  // phone number of primary calendar user
    phoneNumbers: [String],  // additional phone numbers of constiuents
    tokens: {
        type: TokenSchema,
        default: {}
    },
    userPermissions: {
        isAdmin: Boolean,
        inAdminSession: Boolean,
        adminPassphrase: String,
        sessionTimeout: Number
    }
})

module.exports = mongoose.model('Users', UserSchema)