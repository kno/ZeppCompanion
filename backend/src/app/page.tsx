import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white">ZeppCompanion</h1>
          <p className="text-xl text-gray-400">Tu compañero de entrenamiento con mascota virtual</p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-green-600 text-white rounded-full text-lg font-medium hover:bg-green-700 transition"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 bg-gray-800 text-white rounded-full text-lg font-medium hover:bg-gray-700 transition"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </main>
  )
}
