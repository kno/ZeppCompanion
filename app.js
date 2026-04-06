import './shared/device-polyfill'

App({
  globalData: {
    userPreferences: {},
  },

  onCreate() {
    console.log('ZeepCompanion app created')
  },

  onDestroy() {
    console.log('ZeepCompanion app destroyed')
  },
})
