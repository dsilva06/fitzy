
import React, { useState, useEffect } from 'react';
import LiveCardPreview from '../LiveCardPreview';
import { Lock, Loader2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const detectCardBrand = (number) => {
    const n = number.replace(/\D/g, '');
    if (/^4/.test(n)) return 'visa';
    if (/^5[1-5]/.test(n)) return 'mastercard';
    if (/^3[47]/.test(n)) return 'amex';
    if (/^(6011|65|64[4-9])/.test(n)) return 'discover';
    return 'unknown';
};

const formatCardNumber = (value, brand) => {
    const rawValue = value.replace(/\D/g, '');
    const amexFormat = rawValue.length > 10 ? `${rawValue.slice(0, 4)} ${rawValue.slice(4, 10)} ${rawValue.slice(10, 15)}` : (rawValue.length > 4 ? `${rawValue.slice(0, 4)} ${rawValue.slice(4, 10)}` : rawValue);
    const defaultFormat = rawValue.replace(/(\d{4})(?=\d)/g, '$1 ');
    return brand === 'amex' ? amexFormat.trim() : defaultFormat.trim();
};

const formatExpiry = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
};

const validateForm = ({ cardNumber, expiry, cvc, cardholderName, zip }) => {
    const errors = {};
    const brand = detectCardBrand(cardNumber);
    const rawCardNumber = cardNumber.replace(/\D/g, '');
    const rawExpiry = expiry.replace(/\D/g, '');
    
    if (cardholderName.trim().split(' ').length < 2) errors.cardholderName = 'Enter full name.';
    const isAmex = brand === 'amex';
    if (isAmex && rawCardNumber.length !== 15) errors.cardNumber = 'Invalid card number length for Amex.';
    else if (!isAmex && rawCardNumber.length !== 16) errors.cardNumber = 'Invalid card number length.';

    if (isAmex && cvc.length !== 4) errors.cvc = 'Invalid CVC for Amex.';
    else if (!isAmex && cvc.length !== 3) errors.cvc = 'Invalid CVC.';

    if (rawExpiry.length !== 4) errors.expiry = 'Use MMYY format.';
    else {
        const [month, year] = [parseInt(rawExpiry.slice(0, 2)), parseInt(`20${rawExpiry.slice(2, 4)}`)];
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        if (month < 1 || month > 12) errors.expiry = 'Invalid month.';
        else if (year < currentYear || (year === currentYear && month < currentMonth)) errors.expiry = 'Card is expired.';
    }
    if (!zip.trim()) errors.zip = 'ZIP code is required.';

    return errors;
};

export default function CardForm({ onSave, isSubmitting }) {
    const [form, setForm] = useState({ cardholderName: '', cardNumber: '', expiry: '', cvc: '', country: 'US', zip: '', isDefault: false });
    const [errors, setErrors] = useState({});
    const [cardBrand, setCardBrand] = useState('unknown');

    useEffect(() => {
        const newBrand = detectCardBrand(form.cardNumber);
        if (newBrand !== cardBrand) setCardBrand(newBrand);
    }, [form.cardNumber]);
    
    useEffect(() => {
        setErrors(validateForm(form));
    }, [form]);

    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === 'cardNumber') value = formatCardNumber(value, cardBrand);
        if (name === 'expiry') value = formatExpiry(value);
        if (name === 'cvc') {
            const maxLength = cardBrand === 'amex' ? 4 : 3;
            value = value.replace(/\D/g, '').slice(0, maxLength);
        }
        setForm(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSaveClick = () => {
        const currentErrors = validateForm(form);
        setErrors(currentErrors);
        if (Object.keys(currentErrors).length === 0) {
            onSave({
                card_brand: cardBrand,
                masked_details: `**** **** **** ${form.cardNumber.slice(-4)}`,
                card_expiry: form.expiry,
                is_default: form.isDefault
            });
        }
    };

    const isValid = Object.keys(validateForm(form)).length === 0;

    return (
        <div className="p-6 space-y-6">
            <LiveCardPreview brand={cardBrand} number={form.cardNumber} name={form.cardholderName} expiry={form.expiry} />

            <div className="space-y-4">
                <InputField name="cardholderName" label="Cardholder Name" value={form.cardholderName} onChange={handleChange} error={errors.cardholderName} />
                <InputField name="cardNumber" label="Card Number" value={form.cardNumber} onChange={handleChange} error={errors.cardNumber} maxLength={cardBrand === 'amex' ? 17 : 19} />
                <div className="flex gap-4">
                    <InputField name="expiry" label="Expiry (MM/YY)" value={form.expiry} onChange={handleChange} error={errors.expiry} containerClassName="flex-1" />
                    <InputField name="cvc" label="CVC" value={form.cvc} onChange={handleChange} error={errors.cvc} containerClassName="flex-1" icon={<Lock className="w-4 h-4 text-gray-400"/>} />
                </div>
                <div className="flex gap-4">
                        <div className="flex-1">
                        <Select value={form.country} onValueChange={(value) => setForm(p => ({...p, country: value}))}>
                            <SelectTrigger className="w-full h-12 text-base">
                                <SelectValue placeholder="Country" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="US">United States</SelectItem>
                                <SelectItem value="CA">Canada</SelectItem>
                                <SelectItem value="VE">Venezuela</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <InputField name="zip" label="ZIP Code" value={form.zip} onChange={handleChange} error={errors.zip} containerClassName="flex-1" />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="isDefaultCard" checked={form.isDefault} onCheckedChange={(checked) => setForm(prev => ({...prev, isDefault: checked}))} />
                    <label htmlFor="isDefaultCard" className="text-sm font-medium leading-none text-gray-700">Set as default payment method</label>
                </div>
            </div>
            
            <Button onClick={handleSaveClick} disabled={!isValid || isSubmitting} className="w-full h-12 text-lg">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Card'}
            </Button>
        </div>
    );
}

const InputField = ({ name, label, value, onChange, error, icon, containerClassName = '', ...props }) => (
    <div className={containerClassName}>
        <div className="relative">
            {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
            <Input
                name={name}
                id={name}
                value={value}
                onChange={onChange}
                placeholder={label}
                className={`w-full h-12 text-base ${icon ? 'pl-9' : ''} ${error ? 'border-red-500' : ''}`}
                {...props}
            />
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
);
