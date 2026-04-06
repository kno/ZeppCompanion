Page({
  build() {
    var hmUI = require('@zos/ui')

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 100,
      y: 200,
      w: 280,
      h: 80,
      text: 'HELLO ZEEP',
      text_size: 36,
      color: 0x00FF00,
      align_h: hmUI.align.CENTER_H,
    })
  },
})
