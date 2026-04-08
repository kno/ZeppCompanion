App({
  globalData: {
    currentTraining: null,
    trainingSession: null,
    userPreferences: {
      messageFrequency: 90,
    },
  },
  onCreate(options) {
    console.log("app on create invoke");
  },

  onDestroy(options) {
    console.log("app on destroy invoke");
  },
});
