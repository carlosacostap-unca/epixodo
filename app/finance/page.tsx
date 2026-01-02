"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { useRouter } from "next/navigation";
import { FinanceNavbar } from "@/components/finance/finance-navbar";
import { FinanceHeader } from "@/components/finance/finance-header";
import { FinanceStats } from "@/components/finance/finance-stats";
import { TransactionList } from "@/components/finance/transaction-list";
import { CreateTransactionModal } from "@/components/finance/create-transaction-modal";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FinancePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push("/");
      return;
    }
    setUser(pb.authStore.model);
  }, [router]);

  const fetchTransactions = async () => {
    try {
      const records = await pb.collection("transactions").getFullList({
        sort: "-date",
        requestKey: null
      });
      setTransactions(records);
    } catch (error: any) {
      if (error.status !== 0) {
        console.error("Error fetching transactions:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Subscribe to realtime updates
    pb.collection("transactions").subscribe("*", (e) => {
      if (e.action === "create" || e.action === "update" || e.action === "delete") {
        fetchTransactions();
      }
    });

    return () => {
      pb.collection("transactions").unsubscribe();
    };
  }, []);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent dark:border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <FinanceNavbar user={user} />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Link 
          href="/principal" 
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Principal
        </Link>

        <div className="space-y-8">
          <FinanceHeader onNewTransaction={() => setIsCreateModalOpen(true)} />

          {isLoading ? (
            <div className="mt-8 flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-8">
              <FinanceStats transactions={transactions} />
              <TransactionList 
                transactions={transactions} 
                onUpdate={fetchTransactions}
                onEdit={(transaction) => {
                  setEditingTransaction(transaction);
                  setIsCreateModalOpen(true);
                }}
              />
            </div>
          )}
        </div>
      </main>

      <CreateTransactionModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTransaction(null);
        }}
        onSuccess={fetchTransactions}
        transactionToEdit={editingTransaction}
      />
    </div>
  );
}
