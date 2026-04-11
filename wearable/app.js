import { BaseApp } from "@zeppos/zml/base-app"
import { loadPreferences } from "./utils/preferences"

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
    },
    onCreate(options) {
      console.log("app on create invoke");
      var prefs = loadPreferences();
      this.globalData.userPreferences = prefs;
    },

    onDestroy(options) {
      console.log("app on destroy invoke");
    },
  })
);
