function createConnection() {
    return new google.auth.OAuth2(
        googleConfig.cliendId,
        googleConfig.clientSecret,
        googleConfig.redirect 
    )
}