import { BaseApp } from "@zeppos/zml/base-app"
import { loadPreferences } from "./utils/preferences"
import { Geolocation } from "@zos/sensor"

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
    },
    onCreate(options) {
      console.log("app on create invoke");
      var prefs = loadPreferences();
      this.globalData.userPreferences = prefs;

      // Start GPS early so it has time to get a fix before training begins
      // NOTE: timers don't fire at app level in Zepp OS, so status polling
      // is done by the gps-status-widget on each page instead.
      console.log("[GPS] Attempting early GPS start...")
      try {
        var geo = new Geolocation()
        geo.start()
        this.globalData.geoSensor = geo
        console.log("[GPS] Geolocation sensor created and started")
      } catch (e) {
        console.log("[GPS] Early start FAILED: " + e.message)
        this.globalData.gpsFixed = false
      }
    },

    onDestroy(options) {
      console.log("app on destroy invoke");

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
