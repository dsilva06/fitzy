import React from "react";
import { CreditCard as CreditCardIcon, Wallet } from "lucide-react";

export default function PaymentMethodPicker({
  hasEnoughCredits,
  totalCredits,
  creditCost,
  paymentMethods,
  selectedMethod,
  onSelectMethod,
}) {
  const defaultCard = paymentMethods.find(m => m.is_default && m.type === "card");
  const otherCards = paymentMethods.filter(m => m.type === "card" && !m.is_default);

  React.useEffect(() => {
    if (hasEnoughCredits && !selectedMethod) {
      onSelectMethod({ type: "credits" });
    } else if (!hasEnoughCredits && defaultCard && !selectedMethod) {
      onSelectMethod(defaultCard);
    }
  }, [hasEnoughCredits, defaultCard, selectedMethod]);

  return (
    <div>
      <h3 className="font-bold text-lg text-gray-900 mb-3">Payment Method</h3>
      <div className="space-y-2">
        {/* Credits Option */}
        {hasEnoughCredits && (
          <button
            onClick={() => onSelectMethod({ type: "credits" })}
            className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
              selectedMethod?.type === "credits"
                ? "border-brand-600 bg-brand-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-brand-500 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Credits</p>
                  <p className="text-sm text-gray-600">
                    Current: {totalCredits} • Remaining: {totalCredits - creditCost}
                  </p>
                </div>
              </div>
              {selectedMethod?.type === "credits" && (
                <div className="w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        )}

        {/* Default Card */}
        {defaultCard && (
          <button
            onClick={() => onSelectMethod(defaultCard)}
            className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
              selectedMethod?.id === defaultCard.id
                ? "border-brand-600 bg-brand-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <CreditCardIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{defaultCard.masked_details}</p>
                    <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-medium rounded">
                      Default
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{defaultCard.card_brand}</p>
                </div>
              </div>
              {selectedMethod?.id === defaultCard.id && (
                <div className="w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        )}

        {/* Other Cards */}
        {otherCards.map((card) => (
          <button
            key={card.id}
            onClick={() => onSelectMethod(card)}
            className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
              selectedMethod?.id === card.id
                ? "border-brand-600 bg-brand-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <CreditCardIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{card.masked_details}</p>
                  <p className="text-sm text-gray-600 capitalize">{card.card_brand}</p>
                </div>
              </div>
              {selectedMethod?.id === card.id && (
                <div className="w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}

        {!hasEnoughCredits && paymentMethods.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <p className="mb-3">No payment methods available</p>
            <button className="text-brand-600 font-semibold hover:text-brand-700">
              Add payment method →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}