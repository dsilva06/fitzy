
import React, { useState, useEffect, useMemo } from 'react';
import LiveCardPreview from '../LiveCardPreview';
import { Lock, Loader2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, COUNTRY_CONFIG_MAP } from './countryData';

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

const fallbackCountryConfig = {
    requiresBilling: false,
    requiresPostalCode: true,
    postalCodeLabel: 'Postal Code',
    regionLabel: 'State / Region',
    requiresRegion: false,
};

const validateForm = (form, countryConfig = fallbackCountryConfig) => {
    const errors = {};
    const {
        cardNumber,
        expiry,
        cvc,
        cardholderName,
        postalCode,
        addressLine1,
        city,
        region,
    } = form;
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
    if (countryConfig.requiresBilling) {
        if (!addressLine1.trim()) errors.addressLine1 = 'Street address is required.';
        if (!city.trim()) errors.city = 'City is required.';
        if (countryConfig.requiresRegion && !region.trim()) errors.region = `${countryConfig.regionLabel} is required.`;
    }
    if (countryConfig.requiresPostalCode && !postalCode.trim()) errors.postalCode = `${countryConfig.postalCodeLabel} is required.`;

    return errors;
};

export default function CardForm({ onSave, isSubmitting }) {
    const [form, setForm] = useState({
        cardholderName: '',
        cardNumber: '',
        expiry: '',
        cvc: '',
        country: 'US',
        postalCode: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        region: '',
        isDefault: false,
    });
    const [errors, setErrors] = useState({});
    const [cardBrand, setCardBrand] = useState('unknown');

    const countryConfig = useMemo(
        () => COUNTRY_CONFIG_MAP[form.country] || fallbackCountryConfig,
        [form.country]
    );

    useEffect(() => {
        const newBrand = detectCardBrand(form.cardNumber);
        if (newBrand !== cardBrand) setCardBrand(newBrand);
    }, [form.cardNumber]);
    
    useEffect(() => {
        setErrors(validateForm(form, countryConfig));
    }, [form, countryConfig]);

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
        const currentErrors = validateForm(form, countryConfig);
        setErrors(currentErrors);
        if (Object.keys(currentErrors).length === 0) {
            const rawCardNumber = form.cardNumber.replace(/\D/g, '');
            const lastFour = rawCardNumber.slice(-4);
            const billingDetails = { country: form.country };

            if (countryConfig.requiresBilling) {
                billingDetails.address_line1 = form.addressLine1.trim();
                if (form.addressLine2.trim()) billingDetails.address_line2 = form.addressLine2.trim();
                billingDetails.city = form.city.trim();
                if (countryConfig.requiresRegion || form.region.trim()) billingDetails.region = form.region.trim();
            }
            if (countryConfig.requiresPostalCode && form.postalCode.trim()) {
                billingDetails.postal_code = form.postalCode.trim();
            }

            const meta = {
                cardholder_name: form.cardholderName.trim(),
                billing_address: billingDetails,
                requires_billing: countryConfig.requiresBilling,
                requires_postal_code: countryConfig.requiresPostalCode,
            };

            const maskedDetails = lastFour && lastFour.length === 4 ? `**** **** **** ${lastFour}` : '**** **** **** ****';

            onSave({
                card_brand: cardBrand,
                masked_details: maskedDetails,
                card_expiry: form.expiry,
                is_default: form.isDefault,
                meta,
            });
        }
    };

    const isValid = Object.keys(errors).length === 0;
    const showStandalonePostalField = !countryConfig.requiresBilling && countryConfig.requiresPostalCode;

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
                        <Select value={form.country} onValueChange={(value) => setForm(p => ({ ...p, country: value }))}>
                            <SelectTrigger className="w-full h-12 text-base">
                                <SelectValue placeholder="Country" />
                            </SelectTrigger>
                            <SelectContent>
                                {COUNTRIES.map(country => (
                                    <SelectItem key={country.code} value={country.code}>
                                        {country.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {showStandalonePostalField && (
                        <InputField
                            name="postalCode"
                            label={countryConfig.postalCodeLabel}
                            value={form.postalCode}
                            onChange={handleChange}
                            error={errors.postalCode}
                            containerClassName="flex-1"
                        />
                    )}
                </div>
                {countryConfig.requiresBilling && (
                    <BillingAddressFields
                        form={form}
                        errors={errors}
                        onChange={handleChange}
                        countryConfig={countryConfig}
                    />
                )}

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

const BillingAddressFields = ({ form, errors, onChange, countryConfig }) => {
    return (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-700">Billing address</p>
            <InputField
                name="addressLine1"
                label="Street Address"
                value={form.addressLine1}
                onChange={onChange}
                error={errors.addressLine1}
            />
            <InputField
                name="addressLine2"
                label="Apartment, suite, etc. (optional)"
                value={form.addressLine2}
                onChange={onChange}
                error={errors.addressLine2}
            />
            <div className="flex gap-4">
                <InputField
                    name="city"
                    label="City"
                    value={form.city}
                    onChange={onChange}
                    error={errors.city}
                    containerClassName="flex-1"
                />
                <InputField
                    name="region"
                    label={countryConfig.requiresRegion ? countryConfig.regionLabel : `${countryConfig.regionLabel} (optional)`}
                    value={form.region}
                    onChange={onChange}
                    error={errors.region}
                    containerClassName="flex-1"
                />
            </div>
            {countryConfig.requiresPostalCode && (
                <InputField
                    name="postalCode"
                    label={countryConfig.postalCodeLabel}
                    value={form.postalCode}
                    onChange={onChange}
                    error={errors.postalCode}
                />
            )}
        </div>
    );
};
