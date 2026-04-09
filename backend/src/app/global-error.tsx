'use client'

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Algo salio mal</h2>
          <p className="text-gray-400">{error.message}</p>
          <button
            onClick={() => unstable_retry()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  )
}
