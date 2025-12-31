import { GoogleAuthButton } from "@/components/auth/google-auth-button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 text-center dark:from-zinc-900 dark:to-black">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Epixodo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Tu plataforma de episodios favorita.
          </p>
        </div>
        
        <div className="rounded-xl bg-white p-8 shadow-xl dark:bg-zinc-900/50 dark:ring-1 dark:ring-white/10">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Bienvenido de nuevo
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Inicia sesión para continuar
              </p>
            </div>
            
            <GoogleAuthButton />
            
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Al continuar, aceptas nuestros{" "}
              <a href="#" className="underline hover:text-gray-900 dark:hover:text-white">
                Términos de servicio
              </a>{" "}
              y{" "}
              <a href="#" className="underline hover:text-gray-900 dark:hover:text-white">
                Política de privacidad
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
