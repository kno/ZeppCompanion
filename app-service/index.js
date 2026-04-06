AppService({
  onInit() {
    console.log('Background service started')
  },

  onDestroy() {
    console.log('Background service stopped')
  },
})
