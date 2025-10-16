import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";

const validateForm = ({ email, phone_number, display_name }) => {
    const errors = {};
    if (!email.trim() && !phone_number.trim()) {
        errors.email = "Email or phone is required.";
        errors.phone_number = "Email or phone is required.";
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email.";
    if (!display_name.trim()) errors.display_name = "Display name is required.";
    return errors;
};

export default function ZelleForm({ onSave, isSubmitting }) {
    const [form, setForm] = useState({
        email: '',
        phone_number: '',
        display_name: '',
        is_default: false
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSaveClick = () => {
        const currentErrors = validateForm(form);
        setErrors(currentErrors);
        if (Object.keys(currentErrors).length === 0) {
            onSave({
                ...form,
                masked_details: form.email || form.phone_number
            });
        }
    };

    const isValid = Object.keys(validateForm(form)).length === 0;

    return (
        <div className="p-6 space-y-4">
            <Input name="display_name" placeholder="Display Name (Payee)" value={form.display_name} onChange={handleChange} className="h-12 text-base" error={errors.display_name} />
            {errors.display_name && <p className="text-xs text-red-600 -mt-2">{errors.display_name}</p>}
            
            <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="h-12 text-base" error={errors.email} />
            {errors.email && !errors.display_name && <p className="text-xs text-red-600 -mt-2">{errors.email}</p>}
            
            <div className="flex items-center gap-2">
                <div className="flex-1 border-t" />
                <span className="text-xs text-gray-500">OR</span>
                <div className="flex-1 border-t" />
            </div>

            <Input name="phone_number" placeholder="US Phone Number" value={form.phone_number} onChange={handleChange} className="h-12 text-base" error={errors.phone_number} />
            {errors.phone_number && !errors.display_name && <p className="text-xs text-red-600 -mt-2">{errors.phone_number}</p>}

            <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="isDefaultZelle" checked={form.is_default} onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_default: checked }))} />
                <label htmlFor="isDefaultZelle" className="text-sm font-medium text-gray-700">Set as default payment method</label>
            </div>

            <Button onClick={handleSaveClick} disabled={!isValid || isSubmitting} className="w-full h-12 text-lg">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Zelle'}
            </Button>
        </div>
    );
}