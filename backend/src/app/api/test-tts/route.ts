import { NextResponse } from 'next/server'
import { generateSpeech } from '@/lib/tts'

export async function GET() {
  const text = 'Sigue asi, lo estas haciendo genial!'
  console.log('[test-tts] generating audio for: ' + text)

  const audioBase64 = await generateSpeech(text)

  if (audioBase64) {
    console.log('[test-tts] success, size=' + audioBase64.length + ' chars')
  } else {
    console.log('[test-tts] failed or disabled')
  }

  return NextResponse.json({
    data: {
      message: text,
      audioBase64: audioBase64 ?? null,
    },
  })
}
