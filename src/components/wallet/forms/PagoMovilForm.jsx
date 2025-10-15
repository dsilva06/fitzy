import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';

const VENEZUELAN_BANKS = ["Banco de Venezuela", "Banesco", "Mercantil", "Provincial", "BOD", "BNC"];
const ID_TYPES = ["V", "E", "J", "P"];

const validateForm = ({ bank, account_holder_name, id_type, id_number, phone_number }) => {
    const errors = {};
    if (!bank) errors.bank = "Select a bank.";
    if (!account_holder_name.trim()) errors.account_holder_name = "Name is required.";
    if (!id_type) errors.id_type = "Required.";
    if (!/^\d{6,9}$/.test(id_number)) errors.id_number = "Enter a valid ID number.";
    if (!/^04(12|14|16|24|26)\d{7}$/.test(phone_number)) errors.phone_number = "Use format 04XXXXXXXXX.";
    return errors;
};

export default function PagoMovilForm({ onSave, isSubmitting }) {
    const [form, setForm] = useState({
        bank: '',
        account_holder_name: '',
        id_type: 'V',
        id_number: '',
        phone_number: '',
        reference_note: '',
        is_default: false
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSaveClick = () => {
        const currentErrors = validateForm(form);
        setErrors(currentErrors);
        if (Object.keys(currentErrors).length === 0) {
            onSave({
                ...form,
                masked_details: `${form.bank}, CI ${form.id_type}-${form.id_number}`
            });
        }
    };

    const isValid = Object.keys(validateForm(form)).length === 0;

    return (
        <div className="p-6 space-y-4">
            <Select onValueChange={(value) => handleSelectChange('bank', value)} value={form.bank}>
                <SelectTrigger className="w-full h-12 text-base" error={errors.bank}><SelectValue placeholder="Bank" /></SelectTrigger>
                <SelectContent>
                    {VENEZUELAN_BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
            </Select>
            {errors.bank && <p className="text-xs text-red-600 -mt-2">{errors.bank}</p>}

            <Input name="account_holder_name" placeholder="Account Holder Name" value={form.account_holder_name} onChange={handleChange} className="h-12 text-base" error={errors.account_holder_name} />
            {errors.account_holder_name && <p className="text-xs text-red-600 -mt-2">{errors.account_holder_name}</p>}

            <div className="flex gap-2">
                <Select onValueChange={(value) => handleSelectChange('id_type', value)} value={form.id_type}>
                    <SelectTrigger className="w-24 h-12 text-base" error={errors.id_type}><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {ID_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
                <div className="flex-1">
                    <Input name="id_number" placeholder="ID Number" value={form.id_number} onChange={handleChange} className="h-12 text-base" error={errors.id_number} />
                    {errors.id_number && <p className="text-xs text-red-600 mt-1">{errors.id_number}</p>}
                </div>
            </div>

            <Input name="phone_number" placeholder="Phone Number" value={form.phone_number} onChange={handleChange} className="h-12 text-base" error={errors.phone_number} />
            {errors.phone_number && <p className="text-xs text-red-600 -mt-2">{errors.phone_number}</p>}
            
            <Textarea name="reference_note" placeholder="Optional reference note" value={form.reference_note} onChange={handleChange} />

            <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="isDefaultPagoMovil" checked={form.is_default} onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_default: checked }))} />
                <label htmlFor="isDefaultPagoMovil" className="text-sm font-medium text-gray-700">Set as default payment method</label>
            </div>

            <Button onClick={handleSaveClick} disabled={!isValid || isSubmitting} className="w-full h-12 text-lg">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Pago Móvil'}
            </Button>
        </div>
    );
}