import React, { useState } from "react";
import { X, Clock, MapPin, User as UserIcon, CreditCard, Loader2, CheckCircle } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import PaymentMethodPicker from "./PaymentMethodPicker";

export default function CheckoutSheet({ session, venue, classType, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: packageOwnerships } = useQuery({
    queryKey: ['packageOwnerships', user?.id],
    queryFn: () => base44.entities.PackageOwnership.filter({ user_id: user.id, status: "active" }),
    enabled: !!user,
    initialData: [],
  });

  const totalCredits = packageOwnerships.reduce((sum, p) => sum + p.credits_remaining, 0);
  const hasEnoughCredits = totalCredits >= session.credit_cost;

  const { data: paymentMethods } = useQuery({
    queryKey: ['paymentMethods', user?.id],
    queryFn: () => base44.entities.PaymentMethod.filter({ user_id: user.id }),
    enabled: !!user,
    initialData: [],
  });

  const duration = differenceInMinutes(
    new Date(session.end_datetime),
    new Date(session.start_datetime)
  );

  const confirmBookingMutation = useMutation({
    mutationFn: async () => {
      // Create booking
      const booking = await base44.entities.Booking.create({
        user_id: user.id,
        session_id: session.id,
        status: "pending",
        cancellation_deadline: new Date(new Date(session.start_datetime).getTime() - 6 * 60 * 60 * 1000).toISOString(),
      });

      // Process payment
      if (selectedPaymentMethod?.type === "credits") {
        // Deduct credits
        let creditsToDeduct = session.credit_cost;
        const sortedOwnerships = [...packageOwnerships].sort((a, b) => 
          new Date(a.expires_at) - new Date(b.expires_at)
        );

        for (const ownership of sortedOwnerships) {
          if (creditsToDeduct <= 0) break;
          const deduction = Math.min(ownership.credits_remaining, creditsToDeduct);
          await base44.entities.PackageOwnership.update(ownership.id, {
            credits_remaining: ownership.credits_remaining - deduction,
          });
          creditsToDeduct -= deduction;
        }

        // Create payment record
        await base44.entities.Payment.create({
          booking_id: booking.id,
          method: "credits",
          amount: 0,
          status: "paid",
        });

        // Update session capacity
        await base44.entities.Session.update(session.id, {
          capacity_taken: session.capacity_taken + 1,
        });

        // Update booking to confirmed
        await base44.entities.Booking.update(booking.id, { status: "confirmed" });
      } else {
        // Card payment
        await base44.entities.Payment.create({
          booking_id: booking.id,
          method: selectedPaymentMethod.type,
          amount: session.price,
          status: "paid",
        });

        await base44.entities.Session.update(session.id, {
          capacity_taken: session.capacity_taken + 1,
        });

        await base44.entities.Booking.update(booking.id, { status: "confirmed" });
      }

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['packageOwnerships'] });
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    },
  });

  const handleConfirm = async () => {
    if (!selectedPaymentMethod) return;
    setIsProcessing(true);
    try {
      await confirmBookingMutation.mutateAsync();
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to complete booking. Please try again.");
    }
    setIsProcessing(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Scrim */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Grabber */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {showSuccess ? (
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
              <p className="text-gray-600">Your class has been booked successfully</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Booking Summary */}
              <div className="p-6 space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">
                    {classType?.name || "Class"}
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{venue.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-gray-700">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>
                        {format(new Date(session.start_datetime), "EEEE, MMM d 'at' h:mm a")}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-gray-700">
                      <UserIcon className="w-4 h-4 text-blue-600" />
                      <span>Coach: {session.coach_name} • {duration} min</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-blue-100 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="text-2xl font-bold text-gray-900">${session.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">or</p>
                      <p className="text-xl font-bold text-blue-600">{session.credit_cost} credits</p>
                    </div>
                  </div>
                </div>

                {/* Payment Method Picker */}
                <PaymentMethodPicker
                  hasEnoughCredits={hasEnoughCredits}
                  totalCredits={totalCredits}
                  creditCost={session.credit_cost}
                  paymentMethods={paymentMethods}
                  selectedMethod={selectedPaymentMethod}
                  onSelectMethod={setSelectedPaymentMethod}
                />

                {/* Cancellation Policy */}
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                  Cancel up to 6 hours before class starts for a full refund
                </div>
              </div>

              {/* Actions */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 space-y-3">
                <button
                  onClick={handleConfirm}
                  disabled={!selectedPaymentMethod || isProcessing}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Confirm & Book
                    </>
                  )}
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full py-3 text-gray-600 font-semibold hover:text-gray-800 transition-colors"
                >
                  Cancel booking
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}