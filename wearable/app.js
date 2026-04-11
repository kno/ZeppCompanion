import { BaseApp } from "@zeppos/zml/base-app"
import { loadPreferences } from "./utils/preferences"
import { Geolocation } from "@zos/sensor"
import { createTimer, stopTimer } from "@zos/timer"

App(
  BaseApp({
    globalData: {
      currentTraining: null,
      trainingSession: null,
      userPreferences: {
        darkMode: true,
        enableCompanionMessages: true,
        enableAudioMessages: true,
        messageFrequency: 90,
      },
      geoSensor: null,
      gpsFixed: false,
      gpsTimerId: null,
    },
    onCreate(options) {
      console.log("app on create invoke");
      var prefs = loadPreferences();
      this.globalData.userPreferences = prefs;

      // Start GPS early so it has time to get a fix before training begins
      try {
        var geo = new Geolocation()
        geo.start()
        this.globalData.geoSensor = geo

        var self = this
        var timerId = createTimer(2000, 2000, function () {
          try {
            if (self.globalData.geoSensor && self.globalData.geoSensor.getStatus() === 'A') {
              self.globalData.gpsFixed = true
            } else {
              self.globalData.gpsFixed = false
            }
          } catch (e) {
            console.log("GPS poll error: " + e.message)
          }
        })
        this.globalData.gpsTimerId = timerId
      } catch (e) {
        console.log("Geolocation early start error: " + e.message)
      }
    },

    onDestroy(options) {
      console.log("app on destroy invoke");

      if (this.globalData.gpsTimerId !== null) {
        stopTimer(this.globalData.gpsTimerId)
        this.globalData.gpsTimerId = null
      }

      if (this.globalData.geoSensor) {
        try {
          this.globalData.geoSensor.stop()
        } catch (e) {
          console.log("Geolocation stop error: " + e.message)
        }
        this.globalData.geoSensor = null
      }
    },
  })
);
