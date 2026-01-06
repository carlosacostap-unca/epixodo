"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { useRouter } from "next/navigation";
import { FinanceNavbar } from "@/components/finance/finance-navbar";
import { FinanceHeader } from "@/components/finance/finance-header";
import { FinanceStats } from "@/components/finance/finance-stats";
import { TransactionList } from "@/components/finance/transaction-list";
import { AccountsList } from "@/components/finance/accounts-list";
import { CreditCardsList } from "@/components/finance/credit-cards-list";
import { CreditCardPurchasesList } from "@/components/finance/credit-card-purchases-list";
import { CreateTransactionModal } from "@/components/finance/create-transaction-modal";
import { CreateAccountModal } from "@/components/finance/create-account-modal";
import { CreateCreditCardModal } from "@/components/finance/create-credit-card-modal";
import { CreateCreditCardPurchaseModal } from "@/components/finance/create-credit-card-purchase-modal";
import { CreateCreditModal } from "@/components/finance/create-credit-modal";
import { CreateTaxModal } from "@/components/finance/create-tax-modal";
import { CreateServiceModal } from "@/components/finance/create-service-modal";
import { CreditsList } from "@/components/finance/credits-list";
import { TaxesList } from "@/components/finance/taxes-list";
import { ServicesList } from "@/components/finance/services-list";
import { Loader2, ArrowLeft, LayoutDashboard, Wallet, CreditCard, ShoppingCart, Banknote, FileText, Zap } from "lucide-react";
import Link from "next/link";

export default function FinancePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'credit-cards' | 'purchases' | 'credits' | 'taxes' | 'services'>('dashboard');

  // Transactions State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  // Accounts State
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  // Credit Cards State
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [isCreditCardModalOpen, setIsCreditCardModalOpen] = useState(false);
  const [editingCreditCard, setEditingCreditCard] = useState<any>(null);

  // Credit Card Purchases State
  const [purchases, setPurchases] = useState<any[]>([]);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);

  // Credits State
  const [credits, setCredits] = useState<any[]>([]);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [editingCredit, setEditingCredit] = useState<any>(null);

  // Taxes State
  const [taxes, setTaxes] = useState<any[]>([]);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<any>(null);

  // Services State
  const [services, setServices] = useState<any[]>([]);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push("/");
      return;
    }
    setUser(pb.authStore.model);
  }, [router]);

  const fetchTransactions = async () => {
    try {
      const records = await pb.collection("transactions").getList(1, 50, {
        sort: "-date",
        filter: `user = "${pb.authStore.model?.id}"`,
        expand: "account",
        requestKey: null, // Disable auto-cancellation
      });
      setTransactions(records.items);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const records = await pb.collection("accounts").getList(1, 50, {
        sort: "name",
        filter: `user = "${pb.authStore.model?.id}"`,
        requestKey: null, // Disable auto-cancellation
      });
      setAccounts(records.items);
    } catch (error: any) {
      // If collection doesn't exist yet (404), just set empty
      if (error.status === 404) {
        console.warn("Accounts collection might not exist yet.");
        setAccounts([]);
      } else {
        console.error("Error fetching accounts:", error);
      }
    }
  };

  const fetchCreditCards = async () => {
    try {
      const records = await pb.collection("credit_cards").getList(1, 50, {
        sort: "name",
        filter: `user = "${pb.authStore.model?.id}"`,
        requestKey: null, // Disable auto-cancellation
      });
      setCreditCards(records.items);
    } catch (error: any) {
      if (error.status === 404) {
        console.warn("Credit cards collection might not exist yet.");
        setCreditCards([]);
      } else {
        console.error("Error fetching credit cards:", error);
      }
    }
  };

  const fetchPurchases = async () => {
    try {
      const records = await pb.collection("credit_card_purchases").getList(1, 50, {
        sort: "-purchase_date",
        filter: `user = "${pb.authStore.model?.id}"`,
        expand: "credit_card,credit_card_installments(purchase)",
        requestKey: null,
      });
      setPurchases(records.items);
    } catch (error: any) {
        if (error.status === 404) {
            console.warn("Purchases collection might not exist yet.");
            setPurchases([]);
        } else {
            console.error("Error fetching purchases:", error);
        }
    }
  };

  const fetchCredits = async () => {
    try {
      const records = await pb.collection("credits").getList(1, 50, {
        sort: "name",
        filter: `user = "${pb.authStore.model?.id}"`,
        requestKey: null,
      });
      setCredits(records.items);
    } catch (error: any) {
        if (error.status === 404) {
            console.warn("Credits collection might not exist yet.");
            setCredits([]);
        } else {
            console.error("Error fetching credits:", error);
        }
    }
  };

  const fetchTaxes = async () => {
    try {
      const records = await pb.collection("taxes").getList(1, 50, {
        sort: "name",
        filter: `user = "${pb.authStore.model?.id}"`,
        requestKey: null,
      });
      setTaxes(records.items);
    } catch (error: any) {
        if (error.status === 404) {
            console.warn("Taxes collection might not exist yet.");
            setTaxes([]);
        } else {
            console.error("Error fetching taxes:", error);
        }
    }
  };

  const fetchServices = async () => {
    try {
      const records = await pb.collection("services").getList(1, 50, {
        sort: "name",
        filter: `user = "${pb.authStore.model?.id}"`,
        requestKey: null,
      });
      setServices(records.items);
    } catch (error: any) {
        if (error.status === 404) {
            console.warn("Services collection might not exist yet.");
            setServices([]);
        } else {
            console.error("Error fetching services:", error);
        }
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([
        fetchTransactions(), 
        fetchAccounts(), 
        fetchCreditCards(),
        fetchPurchases(),
        fetchCredits(),
        fetchTaxes(),
        fetchServices()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    pb.collection("transactions").subscribe("*", (e) => {
      if (e.action === "create" || e.action === "update" || e.action === "delete") {
        fetchTransactions();
      }
    });

    pb.collection("accounts").subscribe("*", (e) => {
      if (e.action === "create" || e.action === "update" || e.action === "delete") {
        fetchAccounts();
      }
    });

    pb.collection("credit_cards").subscribe("*", (e) => {
      if (e.action === "create" || e.action === "update" || e.action === "delete") {
        fetchCreditCards();
      }
    });

    pb.collection("credit_card_purchases").subscribe("*", (e) => {
        if (e.action === "create" || e.action === "update" || e.action === "delete") {
          fetchPurchases();
        }
    });

    pb.collection("credits").subscribe("*", (e) => {
        if (e.action === "create" || e.action === "update" || e.action === "delete") {
          fetchCredits();
        }
    });

    pb.collection("taxes").subscribe("*", (e) => {
        if (e.action === "create" || e.action === "update" || e.action === "delete") {
          fetchTaxes();
        }
    });

    pb.collection("services").subscribe("*", (e) => {
        if (e.action === "create" || e.action === "update" || e.action === "delete") {
          fetchServices();
        }
    });

    return () => {
      pb.collection("transactions").unsubscribe();
      pb.collection("accounts").unsubscribe();
      pb.collection("credit_cards").unsubscribe();
      pb.collection("credit_card_purchases").unsubscribe();
      pb.collection("credits").unsubscribe();
      pb.collection("taxes").unsubscribe();
      pb.collection("services").unsubscribe();
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
          <FinanceHeader 
            title={
                activeTab === 'dashboard' ? "Finanzas" : 
                activeTab === 'accounts' ? "Cuentas" : 
                activeTab === 'credit-cards' ? "Tarjetas de Crédito" :
                activeTab === 'purchases' ? "Compras con Tarjeta" :
                activeTab === 'credits' ? "Créditos" :
                activeTab === 'taxes' ? "Impuestos" :
                "Servicios"
            }
            description={
              activeTab === 'dashboard' ? "Gestiona tus ingresos y gastos" : 
              activeTab === 'accounts' ? "Administra tus cuentas bancarias y efectivo" :
              activeTab === 'credit-cards' ? "Gestiona tus tarjetas, límites y vencimientos" :
              activeTab === 'purchases' ? "Registra y controla tus compras en cuotas" :
              activeTab === 'credits' ? "Gestiona tus préstamos y créditos" :
              activeTab === 'taxes' ? "Controla tus obligaciones tributarias" :
              "Administra tus servicios recurrentes"
            }
            actionLabel={
              activeTab === 'dashboard' ? "Nueva Transacción" : 
              activeTab === 'accounts' ? "Nueva Cuenta" :
              activeTab === 'credit-cards' ? "Nueva Tarjeta" :
              activeTab === 'purchases' ? "Nueva Compra" :
              activeTab === 'credits' ? "Nuevo Crédito" :
              activeTab === 'taxes' ? "Nuevo Impuesto" :
              "Nuevo Servicio"
            }
            onAction={() => {
              if (activeTab === 'dashboard') setIsTransactionModalOpen(true);
              else if (activeTab === 'accounts') setIsAccountModalOpen(true);
              else if (activeTab === 'credit-cards') setIsCreditCardModalOpen(true);
              else if (activeTab === 'purchases') setIsPurchaseModalOpen(true);
              else if (activeTab === 'credits') setIsCreditModalOpen(true);
              else if (activeTab === 'taxes') setIsTaxModalOpen(true);
              else if (activeTab === 'services') setIsServiceModalOpen(true);
            }}
          />

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-zinc-800">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`
                  flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-zinc-700 dark:hover:text-gray-300'}
                `}
              >
                <LayoutDashboard className="h-4 w-4" />
                Resumen
              </button>
              <button
                onClick={() => setActiveTab('accounts')}
                className={`
                  flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${activeTab === 'accounts'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-zinc-700 dark:hover:text-gray-300'}
                `}
              >
                <Wallet className="h-4 w-4" />
                Cuentas
              </button>
              <button
                onClick={() => setActiveTab('credit-cards')}
                className={`
                  flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${activeTab === 'credit-cards'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-zinc-700 dark:hover:text-gray-300'}
                `}
              >
                <CreditCard className="h-4 w-4" />
                Tarjetas
              </button>
              <button
                onClick={() => setActiveTab('purchases')}
                className={`
                  flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${activeTab === 'purchases'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-zinc-700 dark:hover:text-gray-300'}
                `}
              >
                <ShoppingCart className="h-4 w-4" />
                Compras TC
              </button>
              <button
                onClick={() => setActiveTab('credits')}
                className={`
                  flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${activeTab === 'credits'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-zinc-700 dark:hover:text-gray-300'}
                `}
              >
                <Banknote className="h-4 w-4" />
                Créditos
              </button>
              <button
                onClick={() => setActiveTab('taxes')}
                className={`
                  flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${activeTab === 'taxes'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-zinc-700 dark:hover:text-gray-300'}
                `}
              >
                <FileText className="h-4 w-4" />
                Impuestos
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`
                  flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${activeTab === 'services'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-zinc-700 dark:hover:text-gray-300'}
                `}
              >
                <Zap className="h-4 w-4" />
                Servicios
              </button>
            </nav>
          </div>

          {isLoading ? (
            <div className="mt-8 flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="mt-6">
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  <FinanceStats transactions={transactions} accounts={accounts} />
                  <TransactionList 
                    transactions={transactions} 
                    onUpdate={fetchTransactions}
                    onEdit={(transaction) => {
                      setEditingTransaction(transaction);
                      setIsTransactionModalOpen(true);
                    }}
                  />
                </div>
              )}
              
              {activeTab === 'accounts' && (
                <AccountsList 
                  accounts={accounts}
                  onUpdate={fetchAccounts}
                  onEdit={(account) => {
                    setEditingAccount(account);
                    setIsAccountModalOpen(true);
                  }}
                />
              )}

              {activeTab === 'credit-cards' && (
                <CreditCardsList 
                  cards={creditCards}
                  onEdit={(card) => {
                    setEditingCreditCard(card);
                    setIsCreditCardModalOpen(true);
                  }}
                  onUpdate={fetchCreditCards}
                />
              )}

              {activeTab === 'purchases' && (
                <CreditCardPurchasesList 
                  purchases={purchases}
                  onEdit={(purchase) => {
                    setEditingPurchase(purchase);
                    setIsPurchaseModalOpen(true);
                  }}
                  onUpdate={fetchPurchases}
                />
              )}

              {activeTab === 'credits' && (
                <CreditsList 
                  credits={credits}
                  onEdit={(credit) => {
                    setEditingCredit(credit);
                    setIsCreditModalOpen(true);
                  }}
                  onUpdate={fetchCredits}
                />
              )}

              {activeTab === 'taxes' && (
                <TaxesList 
                  taxes={taxes}
                  onEdit={(tax) => {
                    setEditingTax(tax);
                    setIsTaxModalOpen(true);
                  }}
                  onUpdate={fetchTaxes}
                />
              )}

              {activeTab === 'services' && (
                <ServicesList 
                  services={services}
                  onEdit={(service) => {
                    setEditingService(service);
                    setIsServiceModalOpen(true);
                  }}
                  onUpdate={fetchServices}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Transaction Modal */}
      <CreateTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSuccess={fetchTransactions}
        transactionToEdit={editingTransaction}
        accounts={accounts}
      />

      {/* Account Modal */}
      <CreateAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        onSuccess={fetchAccounts}
        accountToEdit={editingAccount}
      />

      {/* Credit Card Modal */}
      <CreateCreditCardModal
        isOpen={isCreditCardModalOpen}
        onClose={() => {
          setIsCreditCardModalOpen(false);
          setEditingCreditCard(null);
        }}
        onSuccess={fetchCreditCards}
        cardToEdit={editingCreditCard}
      />

      {/* Purchase Modal */}
      <CreateCreditCardPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => {
            setIsPurchaseModalOpen(false);
            setEditingPurchase(null);
        }}
        onSuccess={fetchPurchases}
        creditCards={creditCards}
        purchaseToEdit={editingPurchase}
      />

      {/* Credit Modal */}
      <CreateCreditModal
        isOpen={isCreditModalOpen}
        onClose={() => {
          setIsCreditModalOpen(false);
          setEditingCredit(null);
        }}
        onSuccess={fetchCredits}
        creditToEdit={editingCredit}
      />

      {/* Tax Modal */}
      <CreateTaxModal
        isOpen={isTaxModalOpen}
        onClose={() => {
          setIsTaxModalOpen(false);
          setEditingTax(null);
        }}
        onSuccess={fetchTaxes}
        taxToEdit={editingTax}
      />

      {/* Service Modal */}
      <CreateServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setEditingService(null);
        }}
        onSuccess={fetchServices}
        serviceToEdit={editingService}
      />
    </div>
  );
}
