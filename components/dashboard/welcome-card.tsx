"use client";

export function WelcomeCard({ user }: { user: any }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-zinc-900 dark:ring-white/10">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        ¡Hola, {user.name || "Usuario"}!
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Bienvenido a tu panel de control. Aquí podrás gestionar tus episodios.
      </p>
    </div>
  );
}
