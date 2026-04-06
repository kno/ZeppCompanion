import { createWidget, widget, align, text_style } from '@zos/ui'
import { HeartRate, Step, Battery } from '@zos/sensor'
import { push } from '@zos/router'

const heartRate = new HeartRate()
const step = new Step()
const battery = new Battery()

Page({
  state: {
    hrWidget: null,
    stepWidget: null,
    batteryWidget: null,
  },

  onInit() {
    console.log('Home page initialized')
  },

  build() {
    // Title
    createWidget(widget.TEXT, {
      x: 0,
      y: 40,
      w: 480,
      h: 50,
      text: 'ZeepCompanion',
      text_size: 32,
      color: 0xFFFFFF,
      align_h: align.CENTER_H,
    })

    // Heart Rate Section
    createWidget(widget.TEXT, {
      x: 40,
      y: 130,
      w: 400,
      h: 30,
      text: 'Heart Rate',
      text_size: 22,
      color: 0xFC6950,
      align_h: align.CENTER_H,
    })

    this.state.hrWidget = createWidget(widget.TEXT, {
      x: 40,
      y: 165,
      w: 400,
      h: 50,
      text: '--',
      text_size: 48,
      color: 0xFFFFFF,
      align_h: align.CENTER_H,
    })

    // Steps Section
    createWidget(widget.TEXT, {
      x: 40,
      y: 240,
      w: 400,
      h: 30,
      text: 'Steps',
      text_size: 22,
      color: 0x5BE7A9,
      align_h: align.CENTER_H,
    })

    this.state.stepWidget = createWidget(widget.TEXT, {
      x: 40,
      y: 275,
      w: 400,
      h: 50,
      text: String(step.getCurrent() || '0'),
      text_size: 48,
      color: 0xFFFFFF,
      align_h: align.CENTER_H,
    })

    // Battery Section
    createWidget(widget.TEXT, {
      x: 40,
      y: 350,
      w: 400,
      h: 30,
      text: 'Battery',
      text_size: 22,
      color: 0x58D0FF,
      align_h: align.CENTER_H,
    })

    this.state.batteryWidget = createWidget(widget.TEXT, {
      x: 40,
      y: 385,
      w: 400,
      h: 50,
      text: battery.getCurrent() + '%',
      text_size: 48,
      color: 0xFFFFFF,
      align_h: align.CENTER_H,
    })

    // Start sensor listeners
    this._onHrChange = () => {
      const bpm = heartRate.getCurrent()
      if (bpm > 0) {
        this.state.hrWidget.setProperty(widget.TEXT, String(bpm))
      }
    }

    this._onStepChange = () => {
      this.state.stepWidget.setProperty(widget.TEXT, String(step.getCurrent()))
    }

    this._onBatteryChange = () => {
      this.state.batteryWidget.setProperty(widget.TEXT, battery.getCurrent() + '%')
    }

    heartRate.onCurrentChange(this._onHrChange)
    step.onChange(this._onStepChange)
    battery.onChange(this._onBatteryChange)
  },

  onDestroy() {
    heartRate.offCurrentChange(this._onHrChange)
    step.offChange(this._onStepChange)
    battery.offChange(this._onBatteryChange)
  },
})
