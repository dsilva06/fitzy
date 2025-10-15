import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';

const validateForm = ({ email, uid }) => {
    const errors = {};
    if (!email.trim() && !uid.trim()) {
        errors.email = "Email or UID is required.";
        errors.uid = "Email or UID is required.";
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email.";
    if (uid && !/^\d+$/.test(uid)) errors.uid = "UID should be numeric.";
    return errors;
};

export default function BinanceForm({ onSave, isSubmitting }) {
    const [form, setForm] = useState({
        email: '',
        uid: '',
        memo_tag: '',
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
            let masked_details = '';
            if (form.uid) {
                masked_details = form.uid.length > 7 ? `${form.uid.slice(0, 4)}...${form.uid.slice(-3)}` : form.uid;
            } else if (form.email) {
                const parts = form.email.split('@');
                masked_details = parts[0].length > 4 ? `${parts[0].slice(0,3)}...@${parts[1]}`: form.email;
            }
            onSave({ ...form, masked_details });
        }
    };

    const isValid = Object.keys(validateForm(form)).length === 0;

    return (
        <div className="p-6 space-y-4">
            <Input name="uid" placeholder="UID" value={form.uid} onChange={handleChange} className="h-12 text-base" error={errors.uid} />
            {errors.uid && <p className="text-xs text-red-600 -mt-2">{errors.uid}</p>}
            
            <div className="flex items-center gap-2">
                <div className="flex-1 border-t" />
                <span className="text-xs text-gray-500">OR</span>
                <div className="flex-1 border-t" />
            </div>

            <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="h-12 text-base" error={errors.email} />
            {errors.email && <p className="text-xs text-red-600 -mt-2">{errors.email}</p>}

            <Textarea name="memo_tag" placeholder="Optional Memo/Tag" value={form.memo_tag} onChange={handleChange} />
            
            <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="isDefaultBinance" checked={form.is_default} onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_default: checked }))} />
                <label htmlFor="isDefaultBinance" className="text-sm font-medium text-gray-700">Set as default payment method</label>
            </div>

            <Button onClick={handleSaveClick} disabled={!isValid || isSubmitting} className="w-full h-12 text-lg">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Binance'}
            </Button>
        </div>
    );
}