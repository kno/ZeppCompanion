import './shared/device-polyfill'
import { BaseApp } from '@zeppos/zml/base-app'

App(
  BaseApp({
    globalData: {
      currentTraining: null,
      trainingSession: null,
      userPreferences: {
        messageFrequency: 90,
        companionStyle: 'motivational',
        backendUrl: '',
      },
    },
    onCreate() {
      console.log('ZeepCompanion app created')
    },
    onDestroy() {
      console.log('ZeepCompanion app destroyed')
    },
  })
)
