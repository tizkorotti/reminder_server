const { DEFAULT_NOFITY_MILLISECONDS } = require('./consts/consts')

const getCurrentDiff = (event) => {
    
    let diffTime = DEFAULT_NOFITY_MILLISECONDS
    const useDefaults = event.reminders.useDefaults
    const hasOverrides = event.reminders.overrides
  
    if (!useDefaults && hasOverrides && event.reminders.overrides[0].minutes) {
      diffTime = (event.reminders.overrides[0].minutes * 60 * 1000)
    } else if (!useDefaults && hasOverrides && event.reminders.overrides[0].hours) {
      diffTime = (event.reminders.overrides[0].hours * 60 * 60 * 1000)
    } else if (!useDefaults && hasOverrides && event.reminders.overrides[0].days) {
      diffTime = (event.reminders.overrides[0].days * 86400000)
    }
  
    return diffTime
}

module.exports = {
    getCurrentDiff
}