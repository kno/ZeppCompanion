import { spawn } from 'child_process'

const PIPER_PATH = process.env.PIPER_PATH || '/Users/aruizdesamaniego/Library/Python/3.9/bin/piper'

export async function generateSpeech(text: string): Promise<string | null> {
  if (process.env.TTS_ENABLED !== 'true') {
    return null
  }

  const modelPath = process.env.PIPER_MODEL_PATH || ''
  if (!modelPath) return null

  return new Promise((resolve) => {
    let settled = false
    const settle = (value: string | null) => {
      if (!settled) {
        settled = true
        clearTimeout(timeoutId)
        resolve(value)
      }
    }

    const timeoutId = setTimeout(() => {
      console.error('[tts] timeout after 8s, aborting')
      piper.kill()
      ffmpeg.kill()
      settle(null)
    }, 8000)

    // Piper (Python): read from stdin, output raw PCM to stdout
    const speaker = process.env.PIPER_SPEAKER || ''
    const piperArgs = [
      '--model', modelPath,
      '--data-dir', modelPath.replace(/\/[^/]+$/, ''),
      '--output-raw',
    ]
    if (speaker) {
      piperArgs.push('--speaker', speaker)
    }
    const piper = spawn(PIPER_PATH, piperArgs)

    // FFmpeg: convert raw PCM s16le 22050Hz mono → MP3 32kbps
    const ffmpeg = spawn('ffmpeg', [
      '-f', 's16le',
      '-ar', '22050',
      '-ac', '1',
      '-i', 'pipe:0',
      '-b:a', '32k',
      '-f', 'mp3',
      'pipe:1',
    ])

    // Pipe piper stdout → ffmpeg stdin
    piper.stdout.pipe(ffmpeg.stdin)

    // Write text to piper stdin
    piper.stdin.write(text)
    piper.stdin.end()

    const mp3Chunks: Buffer[] = []
    ffmpeg.stdout.on('data', (chunk: Buffer) => mp3Chunks.push(chunk))

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        console.error(`[tts] ffmpeg exited with code ${code}`)
        settle(null)
        return
      }
      const mp3Buffer = Buffer.concat(mp3Chunks)
      if (mp3Buffer.length === 0) {
        console.error('[tts] ffmpeg produced empty output')
        settle(null)
        return
      }
      console.log('[tts] generated ' + mp3Buffer.length + ' bytes MP3')
      settle(mp3Buffer.toString('base64'))
    })

    piper.on('error', (err) => {
      console.error('[tts] piper error:', err)
      settle(null)
    })

    ffmpeg.on('error', (err) => {
      console.error('[tts] ffmpeg error:', err)
      settle(null)
    })

    piper.stderr.on('data', () => {})
    ffmpeg.stderr.on('data', () => {})
  })
}
