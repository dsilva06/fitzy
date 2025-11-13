
import React from 'react';
import { MoreHorizontal, Star, Edit, Trash2, Smartphone, Zap } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// --- SVG LOGOS ---
const VisaLogo = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" className="w-10 h-auto"><path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="#1A1F71"/><path d="M12.9 6.8l-1.8 8.7H8.8l1.8-8.7h2.3zm8 .2h2l-1.9 8.5h-2l1.9-8.5zm-4 .1l1.7-8.5h2.3l-1.7 8.5h-2.3zm-4 .1h2l-1.9 8.5h-2l1.9-8.5z" fill="#fff"/></svg>;
const MastercardLogo = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" className="w-10 h-auto"><circle cx="15" cy="12" r="7" fill="#EB001B"/><circle cx="23" cy="12" r="7" fill="#F79E1B" fillOpacity=".8"/></svg>;
const AmexLogo = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" className="w-10 h-auto"><rect width="38" height="24" rx="3" fill="#006FCF"/><path fill="#FFF" d="M19 10.5l-2.1 4.2h-3.6l-1.4-2.8h5.3l-1.9-3.8c0-.1.1-.1.1-.1h5.8l-2.2 4.6h3.6l1.2-2.5h-5.2l1.8-3.6-1.8-3.6h-5.4z"/></svg>;
const ZelleLogo = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white"><path d="M12.003 0A12 12 0 1 0 12.003 24a12 12 0 0 0 0-24zM8.38 18.204a1.002 1.002 0 0 1-1.026-.991V6.787a1.002 1.002 0 0 1 1.026-.99h4.947c2.4 0 4.35 1.948 4.35 4.349 0 2.394-1.95 4.348-4.35 4.348H9.72v2.72a1.002 1.002 0 0 1-1.027.99zM9.72 12.18h3.606c1.173 0 2.126-.954 2.126-2.126s-.953-2.126-2.126-2.126H9.72v4.252z" fill="currentColor"/></svg>;
const BinanceLogo = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-yellow-400"><path d="M16.624 7.375L12 2.75L7.375 7.375L12 12L16.624 7.375z" fill="currentColor"/><path d="M12 12L7.375 16.625L12 21.25L16.625 16.625L12 12z" fill="currentColor"/><path d="M7.375 7.375L2.75 12L7.375 16.625L12 12L7.375 7.375z" fill="currentColor"/><path d="M16.625 16.625L12 12L16.625 7.375L21.25 12L16.625 16.625z" fill="currentColor"/></svg>;

const BANK_THEMES = {
  "default": { bg: "from-gray-700 to-gray-900", iconColor: "text-gray-300" },
  "Banco de Venezuela": { bg: "from-red-600 to-red-800", iconColor: "text-red-100" },
  "Banesco": { bg: "from-green-500 to-green-700", iconColor: "text-green-100" },
  "Mercantil": { bg: "from-brand-600 to-brand-800", iconColor: "text-brand-100" },
  "Provincial": { bg: "from-brand-700 to-brand-900", iconColor: "text-brand-100" },
};

// --- HELPER COMPONENTS ---
const ActionsMenu = ({ isDefault, onSetDefault, onDelete }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-white/70 hover:bg-white/20 hover:text-white rounded-full">
                <MoreHorizontal className="w-5 h-5" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
            <DropdownMenuItem onClick={() => {}} className="cursor-pointer hover:!bg-gray-700"><Edit className="w-4 h-4 mr-2"/>Edit</DropdownMenuItem>
            {!isDefault && <DropdownMenuItem onClick={onSetDefault} className="cursor-pointer hover:!bg-gray-700"><Star className="w-4 h-4 mr-2"/>Set as default</DropdownMenuItem>}
            <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-red-400 hover:!bg-red-500/20 hover:!text-red-400"><Trash2 className="w-4 h-4 mr-2"/>Delete</DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

const DefaultBadge = () => (
    <div className="flex items-center gap-1.5 text-xs font-bold bg-black/30 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
        <Star className="w-3 h-3 fill-yellow-300 text-yellow-300" /> Default
    </div>
);

// --- MAIN CARD COMPONENT ---
export default function PaymentMethodCard({ method, onSetDefault, onDelete }) {
  const { type, is_default, card_brand, masked_details, card_expiry, bank, account_holder_name, id_type, id_number, phone_number, display_name, uid, email, memo_tag } = method;

  const getCardContent = () => {
    let config = {
      bg: "from-gray-800 to-gray-900",
      icon: null,
      title: "",
      primaryLine: "",
      secondaryLine: "",
      footerLine: "",
      ariaLabel: "Payment method"
    };

    switch (type) {
      case 'card':
        config = {
          bg: "from-slate-800 to-slate-900",
          icon: card_brand === 'visa' ? <VisaLogo /> : card_brand === 'mastercard' ? <MastercardLogo /> : <AmexLogo />,
          title: "Credit/Debit Card",
          primaryLine: masked_details.replace(/\s/g, '\u00A0'), // Non-breaking spaces
          footerLine: `${card_brand} • ${card_expiry}`,
          ariaLabel: `${card_brand} card ending in ${masked_details.slice(-4)}`
        };
        break;
      case 'zelle':
        config = {
          bg: "from-purple-600 to-purple-800",
          icon: <ZelleLogo />,
          title: "Zelle",
          primaryLine: display_name,
          secondaryLine: email || phone_number,
          footerLine: "Zelle",
          ariaLabel: `Zelle account for ${display_name}`
        };
        break;
      case 'binance':
        config = {
          bg: "from-black to-gray-900",
          icon: <BinanceLogo />,
          title: "Binance",
          primaryLine: uid ? `UID: ${masked_details}` : masked_details,
          secondaryLine: memo_tag,
          footerLine: "Binance",
          ariaLabel: `Binance account ${uid ? 'UID' : 'email'} ${masked_details}`
        };
        break;
      case 'pago_movil':
        const theme = BANK_THEMES[bank] || BANK_THEMES.default;
        config = {
          bg: theme.bg,
          icon: <Smartphone className={`w-8 h-8 ${theme.iconColor}`} />,
          title: "Pago Móvil",
          primaryLine: account_holder_name,
          secondaryLine: `${id_type}-${id_number} • ${phone_number}`,
          footerLine: bank,
          ariaLabel: `Pago Móvil for ${bank}`
        };
        break;
    }
    return config;
  };

  const content = getCardContent();

  return (
    <div
      aria-label={`${content.ariaLabel}${is_default ? '. Default method.' : ''}`}
      className={`relative rounded-2xl p-5 text-white shadow-lg overflow-hidden h-44 flex flex-col justify-between transition-transform transform hover:scale-[1.02] bg-gradient-to-br ${content.bg}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center">{content.icon}</div>
          <span className="font-semibold text-lg">{content.title}</span>
        </div>
        <div className="flex items-center gap-2">
            {is_default && <DefaultBadge />}
            <ActionsMenu isDefault={is_default} onSetDefault={onSetDefault} onDelete={onDelete} />
        </div>
      </div>

      {/* Content */}
      <div className="z-10">
        <p className="font-semibold text-xl whitespace-nowrap">{content.primaryLine}</p>
        {content.secondaryLine && <p className="text-white/80 text-sm truncate">{content.secondaryLine}</p>}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-white/60 font-medium capitalize z-10">
        <span>{content.footerLine}</span>
      </div>

       {/* Subtle background pattern for Binance */}
      {type === 'binance' && <div className="absolute inset-0 bg-repeat bg-center opacity-[0.03]" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f0b90b' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")"}}/>}
    </div>
  );
}
