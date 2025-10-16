import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fitzy } from '@/api/fitzyClient';
import { X, Loader2, CreditCard, Smartphone, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import CardForm from './forms/CardForm';
import PagoMovilForm from './forms/PagoMovilForm';
import ZelleForm from './forms/ZelleForm';
import BinanceForm from './forms/BinanceForm';

const BinanceIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.624 7.375L12 2.75L7.375 7.375L12 12L16.624 7.375Z" fill="#F0B90B"/>
        <path d="M12 12L7.375 16.625L12 21.25L16.625 16.625L12 12Z" fill="#F0B90B"/>
        <path d="M7.375 7.375L2.75 12L7.375 16.625L12 12L7.375 7.375Z" fill="#F0B90B"/>
        <path d="M16.625 16.625L12 12L16.625 7.375L21.25 12L16.625 16.625Z" fill="#F0B90B"/>
    </svg>
);

const METHOD_TYPES = [
  { id: 'card', label: 'Credit or Debit Card', icon: CreditCard },
  { id: 'pago_movil', label: 'Pago Móvil', icon: Smartphone },
  { id: 'zelle', label: 'Zelle', icon: Zap },
  { id: 'binance', label: 'Binance', icon: BinanceIcon },
];

const listVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

const formVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 },
};

export default function AddPaymentMethodSheet({ onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState('selection'); // 'selection' or a method id
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { data: user, isLoading: isUserLoading } = useQuery({ 
    queryKey: ['currentUser'], 
    queryFn: () => fitzy.auth.me() 
  });

  const mutation = useMutation({
    mutationFn: (newPaymentMethod) => fitzy.entities.PaymentMethod.create(newPaymentMethod),
    onSuccess: async (newMethod) => {
      if (newMethod.is_default) {
          const existingMethods = queryClient.getQueryData(['paymentMethods', user.id]) || [];
          const currentDefault = existingMethods.find(pm => pm.is_default && pm.id !== newMethod.id);
          if (currentDefault) {
              await fitzy.entities.PaymentMethod.update(currentDefault.id, { is_default: false });
          }
      }
      await queryClient.invalidateQueries({ queryKey: ['paymentMethods', user.id] });
      onSuccess();
    },
    onError: (error) => {
      setSubmitError(`Couldn’t save method. ${error.message || 'Please try again.'}`);
      setIsSubmitting(false);
    }
  });

  const handleSave = (formData) => {
    if (!user) {
         setSubmitError("Could not verify user. Please try again.");
         return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    
    const methodData = {
        ...formData,
        user_id: user.id,
        type: view,
    };
    
    mutation.mutate(methodData);
  };

  const renderForm = () => {
    const formProps = { 
      onSave: handleSave,
      isSubmitting: isSubmitting || isUserLoading,
      onClose: onClose,
    };
    switch (view) {
      case 'card':
        return <CardForm {...formProps} />;
      case 'pago_movil':
        return <PagoMovilForm {...formProps} />;
      case 'zelle':
        return <ZelleForm {...formProps} />;
      case 'binance':
        return <BinanceForm {...formProps} />;
      default:
        return null;
    }
  };

  const getHeaderTitle = () => {
    if (view === 'selection') return 'Add Payment Method';
    return `Add ${METHOD_TYPES.find(m => m.id === view)?.label || ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="relative w-full max-w-md bg-gray-50 rounded-t-3xl h-[85vh] max-h-[85vh] overflow-y-auto flex flex-col">
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0"><div className="w-12 h-1.5 bg-gray-300 rounded-full" /></div>
        
        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
          <div className="w-12">
            {view !== 'selection' && (
              <button onClick={() => setView('selection')} className="p-2 hover:bg-gray-200 rounded-full"><ChevronLeft className="w-6 h-6" /></button>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center">{getHeaderTitle()}</h2>
          <div className="w-12 flex justify-end">
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-6 h-6" /></button>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === 'selection' ? (
              <motion.div
                key="selection"
                variants={listVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="p-4 space-y-3"
              >
                {METHOD_TYPES.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setView(method.id)}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                         <method.icon className="w-5 h-5 text-blue-600"/>
                      </div>
                      <span className="font-semibold text-gray-800">{method.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="form"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                {renderForm()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {submitError && <p className="p-6 text-sm text-red-600 text-center flex-shrink-0">{submitError}</p>}
      </motion.div>
    </div>
  );
}