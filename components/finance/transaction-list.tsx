"use client";

import { useState } from "react";
import { pb } from "@/lib/pocketbase";
import { formatDate, TIMEZONE } from "@/lib/date-utils";
import { 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Pencil, 
  ChevronDown, 
  ChevronRight, 
  Filter,
  CheckCircle2,
  Search
} from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  category: string;
  date: string;
  expand?: {
    account?: {
      name: string;
    };
  };
}

interface TransactionListProps {
  transactions: Transaction[];
  onUpdate: () => void;
  onEdit: (transaction: Transaction) => void;
}

const TransactionCard = ({ 
  transaction, 
  onEdit, 
  onDelete, 
  formatCurrency 
}: { 
  transaction: Transaction; 
  onEdit: (t: Transaction) => void; 
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string;
}) => (
  <div className="group flex flex-col gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-gray-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-4 sm:items-center">
      <div className={`mt-1 rounded-full p-2.5 sm:mt-0 ${
        transaction.type === "income" 
          ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
          : "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
      }`}>
        {transaction.type === "income" ? (
          <ArrowUpRight className="h-5 w-5" />
        ) : (
          <ArrowDownLeft className="h-5 w-5" />
        )}
      </div>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {transaction.description}
          </h3>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-zinc-800 dark:text-gray-400">
            {transaction.category}
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            {formatDate(transaction.date)}
          </span>
          {transaction.expand?.account && (
            <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
              • {transaction.expand.account.name}
            </span>
          )}
        </div>
      </div>
    </div>

    <div className="flex items-center justify-between gap-4 pl-14 sm:justify-end sm:pl-0">
      <div className={`text-lg font-semibold ${
        transaction.type === "income"
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400"
      }`}>
        {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:gap-2">
        <button
          onClick={() => onEdit(transaction)}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
          title="Editar"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(transaction.id)}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
);

const Section = ({ 
  title, 
  count, 
  children, 
  isCollapsed, 
  onToggle 
}: { 
  title: string; 
  count: number; 
  children: React.ReactNode; 
  isCollapsed: boolean; 
  onToggle: () => void; 
}) => {
  if (count === 0) return null;
  
  return (
    <div className="space-y-3">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-zinc-800/50"
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <span>{title}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
            {count}
          </span>
        </div>
      </button>
      
      {!isCollapsed && (
        <div className="space-y-3 pl-2">
          {children}
        </div>
      )}
    </div>
  );
};

export function TransactionList({ transactions, onUpdate, onEdit }: TransactionListProps) {
  const [viewMode, setViewMode] = useState<"all" | "focus">("all");
  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>({
    today: false,
    yesterday: false,
    thisWeek: false,
    older: true
  });

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta transacción?")) return;

    try {
      await pb.collection("transactions").delete(id);
      onUpdate();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const categorizeTransactions = (items: Transaction[]) => {
    const groups = {
      today: [] as Transaction[],
      yesterday: [] as Transaction[],
      thisWeek: [] as Transaction[],
      older: [] as Transaction[],
    };

    // Obtenemos la fecha actual en la zona horaria configurada
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('en-CA', { 
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);

    // Calculamos ayer restando 24 horas y formateando en la zona horaria
    const yesterdayDate = new Date(now.getTime() - 86400000);
    const yesterdayStr = new Intl.DateTimeFormat('en-CA', { 
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(yesterdayDate);
    
    // Para "Esta Semana", necesitamos el inicio de la semana en la zona horaria
    // Asumimos que la semana empieza el Domingo (0)
    // Obtenemos el día de la semana en la zona horaria (0-6)
    // formatToParts es más seguro
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE,
      weekday: 'short'
    }).format(now);
    // Pero weekday short es 'Sun', 'Mon'... difícil de parsear numéricamente rápido.
    // Usamos getDay() local pero ajustado? No.
    // Simplemente: restamos días hasta llegar al domingo.
    // O más simple: si la fecha del item es >= hace 7 días.
    // Pero "Esta semana" suele significar "desde el último domingo/lunes".
    
    // Vamos a simplificar "Esta Semana" como "en los últimos 7 días" para evitar complejidad de timezone day-of-week,
    // o intentar aproximar.
    // Si queremos "Esta Semana" (Sun-Sat), necesitamos saber qué día es hoy en la TZ.
    // new Date().getDay() da el día local del navegador. Puede diferir.
    // Vamos a usar una aproximación segura: items de hoy y ayer ya están filtrados.
    // Resto: si la diferencia en días es menor a 7?
    
    // Mejor: usemos comparación de strings YYYY-MM-DD.
    // Calculamos la fecha de "hace 7 días" en TZ.
    const oneWeekAgoDate = new Date(now.getTime() - 7 * 86400000);
    const oneWeekAgoStr = new Intl.DateTimeFormat('en-CA', { 
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(oneWeekAgoDate);

    items.forEach((item) => {
      // Convertimos la fecha del item (UTC) a string YYYY-MM-DD en la zona horaria
      const itemDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(item.date));

      if (itemDateStr === todayStr) {
        groups.today.push(item);
      } else if (itemDateStr === yesterdayStr) {
        groups.yesterday.push(item);
      } else if (itemDateStr >= oneWeekAgoStr) {
        groups.thisWeek.push(item);
      } else {
        groups.older.push(item);
      }
    });

    return groups;
  };

  const categorized = categorizeTransactions(transactions);
  
  const toggleSection = (section: string) => {
    setSectionStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (transactions.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800/50">
        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
          No hay transacciones registradas
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Añade una nueva transacción para comenzar
        </p>
      </div>
    );
  }

  // Focus view only shows today and yesterday
  const showFocusView = viewMode === "focus";

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-1 dark:bg-zinc-800">
          <button
            onClick={() => setViewMode("all")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "all"
                ? "bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <Filter className="h-4 w-4" />
            Todas
          </button>
          <button
            onClick={() => setViewMode("focus")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "focus"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-zinc-700 dark:text-indigo-400"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Recientes
          </button>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {transactions.length} transacciones
        </div>
      </div>

      <div className="space-y-6">
        <Section
          title="Hoy"
          count={categorized.today.length}
          isCollapsed={sectionStates.today}
          onToggle={() => toggleSection("today")}
        >
          {categorized.today.map(t => (
            <TransactionCard 
              key={t.id} 
              transaction={t} 
              onEdit={onEdit} 
              onDelete={handleDelete}
              formatCurrency={formatCurrency}
            />
          ))}
        </Section>

        <Section
          title="Ayer"
          count={categorized.yesterday.length}
          isCollapsed={sectionStates.yesterday}
          onToggle={() => toggleSection("yesterday")}
        >
          {categorized.yesterday.map(t => (
            <TransactionCard 
              key={t.id} 
              transaction={t} 
              onEdit={onEdit} 
              onDelete={handleDelete}
              formatCurrency={formatCurrency}
            />
          ))}
        </Section>

        {!showFocusView && (
          <>
            <Section
              title="Esta Semana"
              count={categorized.thisWeek.length}
              isCollapsed={sectionStates.thisWeek}
              onToggle={() => toggleSection("thisWeek")}
            >
              {categorized.thisWeek.map(t => (
                <TransactionCard 
                  key={t.id} 
                  transaction={t} 
                  onEdit={onEdit} 
                  onDelete={handleDelete}
                  formatCurrency={formatCurrency}
                />
              ))}
            </Section>

            <Section
              title="Anteriores"
              count={categorized.older.length}
              isCollapsed={sectionStates.older}
              onToggle={() => toggleSection("older")}
            >
              {categorized.older.map(t => (
                <TransactionCard 
                  key={t.id} 
                  transaction={t} 
                  onEdit={onEdit} 
                  onDelete={handleDelete}
                  formatCurrency={formatCurrency}
                />
              ))}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
