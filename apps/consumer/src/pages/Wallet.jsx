import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fitzy } from "@/api/fitzyClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Wallet as WalletIcon } from "lucide-react";
import AddPaymentMethodSheet from "../components/wallet/AddPaymentMethodSheet";
import PaymentMethodCard from "../components/wallet/PaymentMethodCard";

export default function WalletPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddSheetOpen, setAddSheetOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => fitzy.auth.me(),
  });

  const { data: paymentMethodsData, isLoading } = useQuery({
    queryKey: ['paymentMethods', user?.id],
    queryFn: () => fitzy.entities.PaymentMethod.filter({ user_id: user?.id }, "-created_date"),
    enabled: !!user,
    initialData: [],
  });
  
  const paymentMethods = useMemo(() => {
    if (!paymentMethodsData) return [];
    // Sort to put default first, then by creation date
    return [...paymentMethodsData].sort((a, b) => {
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        return 0; // Keep original sort for non-defaults
    });
  }, [paymentMethodsData]);

  const deleteMutation = useMutation({
    mutationFn: (id) => fitzy.entities.PaymentMethod.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    },
  });
  
  const defaultMutation = useMutation({
    mutationFn: async (idToSetDefault) => {
      const currentDefault = paymentMethods.find(pm => pm.is_default);
      if (currentDefault && currentDefault.id !== idToSetDefault) {
        await fitzy.entities.PaymentMethod.update(currentDefault.id, { is_default: false });
      }
      await fitzy.entities.PaymentMethod.update(idToSetDefault, { is_default: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    }
  })

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this payment method?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSetDefault = (id) => {
    defaultMutation.mutate(id);
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8 px-4">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
      </div>
      <p className="text-gray-600 px-1 mb-8">Manage your saved payment methods and credits.</p>

      <div className="mb-8">
        <button
          onClick={() => setAddSheetOpen(true)}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-transform transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Add Payment Method
        </button>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-4 px-1">Saved Methods</h2>

      {isLoading && <div className="text-center p-8"><p className="text-gray-500">Loading payment methods...</p></div>}

      <div className="space-y-4">
        {paymentMethods && paymentMethods.map((pm) => (
          <PaymentMethodCard
            key={pm.id}
            method={pm}
            onSetDefault={() => handleSetDefault(pm.id)}
            onDelete={() => handleDelete(pm.id)}
          />
        ))}
        {paymentMethods?.length === 0 && !isLoading && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <WalletIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-lg text-gray-700">No saved payment methods yet.</h3>
            <p className="text-sm text-gray-500 mt-1">Add a card, Zelle, or other method to get started.</p>
          </div>
        )}
      </div>

      {isAddSheetOpen && (
        <AddPaymentMethodSheet
          onClose={() => setAddSheetOpen(false)}
          onSuccess={() => {
            setAddSheetOpen(false);
          }}
        />
      )}
    </div>
  );
}