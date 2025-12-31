"use client";

export function StatsCard() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-zinc-900 dark:ring-white/10">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Estadísticas
      </h2>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
        0
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Episodios vistos
      </p>
    </div>
  );
}
