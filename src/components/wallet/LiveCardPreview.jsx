
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard } from 'lucide-react';

const VisaLogo = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="30" viewBox="0 0 48 30" className="h-6"><path fill="#1A1F71" d="M31.32.112l-5.69 29.77h5.95l5.69-29.77zM47.25 10.3c.33-3.23-2.13-5.2-4.9-6.3-1.8-.72-4.1-1.38-6.66-1.82l-.4.3-3.08 24.87c.84.22 1.63.38 2.39.48 2.22.3 4.2.03 5.6-1.1 2.3-1.85 3.03-4.9 2.2-8.43zm-23.77-1.1c-.2-.68-.6-2.5-1.5-3.3-1.15-1-2.9-1.5-4.5-1.7-.5-.04-1.2-.04-2.1-.04h-5.2L7.3 29.88h6.2c.7 0 1.2-.08 1.6-.2 2.5-1 3.5-3.1 3.8-6.1l1.5-12.7c.07-.6.12-1.1.2-1.6zm-11.4 15.6c-.1.5-.5 2.1-1.4 2.6-1.1.6-2.5.9-4 .9H0L4.7 0h6.1c2.1 0 3.6.6 4.6 2 1.2 1.5 1.5 3.9 1.1 6.1l-3.9 16.8z"/></svg>;
const MastercardLogo = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="30" viewBox="0 0 48 30" className="h-8"><path fill="#FF5F00" d="M24 15a15 15 0 1 0 0-0.001z"/><path fill="#EB001B" d="M24,0A15,15,0,0,0,13.2,4.4a15,15,0,1,1,21.6,21.2A15,15,0,0,0,24,0Z"/><path fill="#F79E1B" d="M13.2 4.4A15 15 0 0 0 4.4 13.2a15 15 0 0 0 21.2 21.2 15 15 0 0 0 19-10.8 15 15 0 0 0-10.8-19A15 15 0 0 0 13.2 4.4z"/></svg>;
const AmexLogo = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="30" viewBox="0 0 48 30" className="h-8"><rect width="48" height="30" rx="3" fill="#006FCF"/><path fill="#FFF" d="M23.9,8.5l-3.1,6.5h-5.3l-2-4.1h7.8L18.6,6c0-0.1,0.1-0.2,0.2-0.2h8.5l-3.3,6.8h5.3l1.8-3.7H23L25.6,15l-2.6,5.3h8.3l1.9-4.1h-5.4l3.3-6.7h-7.8Z"/></svg>;
const DiscoverLogo = () => <svg width="38" height="24" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto rounded"><rect width="38" height="24" fill="#f7961e"/><circle cx="12" cy="12" r="8" fill="#fff"/><path d="M12 4a8 8 0 0 0 0 16 4 4 0 0 0 0-8 4 4 0 0 1 0-8z" fill="#f7961e"/></svg>;

const BrandLogo = ({ brand }) => {
    switch (brand) {
        case 'visa': return <VisaLogo />;
        case 'mastercard': return <MastercardLogo />;
        case 'amex': return <AmexLogo />;
        case 'discover': return <DiscoverLogo />;
        default: return <CreditCard className="w-8 h-8 text-gray-400" />;
    }
};

export default function LiveCardPreview({ brand, number, name, expiry }) {
    const formatNumber = (num, brand) => {
        const digits = num.replace(/\D/g, '');
        const placeholders = brand === 'amex' ? '#### ###### #####' : '#### #### #### ####';
        let formatted = '';
        let digitIndex = 0;
        for (let i = 0; i < placeholders.length; i++) {
            if (placeholders[i] === '#') {
                formatted += digits[digitIndex] || '#';
                digitIndex++;
            } else {
                formatted += placeholders[i];
            }
        }
        return formatted;
    };

    return (
        <div className="w-full max-w-sm mx-auto bg-gradient-to-br from-gray-800 to-black rounded-2xl shadow-2xl p-6 text-white font-mono relative overflow-hidden aspect-[1.586/1]">
            <div className="absolute top-0 left-0 w-full h-full bg-black opacity-10"/>
            <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                    <div className="w-12 h-8 bg-gray-400 rounded-md"></div>
                    <div className="h-8 flex items-center">
                        <AnimatePresence>
                            <motion.div
                                key={brand}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                <BrandLogo brand={brand} />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <div className="text-xl md:text-2xl tracking-wider text-center">
                    {formatNumber(number, brand)}
                </div>

                <div className="flex justify-between items-end text-xs uppercase">
                    <div className="w-2/3">
                        <p className="opacity-70">Cardholder Name</p>
                        <p className="font-semibold tracking-widest truncate">{name || 'John Doe'}</p>
                    </div>
                    <div className="w-1/3 text-right">
                        <p className="opacity-70">Expires</p>
                        <p className="font-semibold">{expiry || 'MM/YY'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
