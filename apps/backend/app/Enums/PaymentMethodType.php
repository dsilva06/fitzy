<?php

namespace App\Enums;

enum PaymentMethodType: string
{
    case Zelle = 'zelle';
    case PagoMovil = 'pago_movil';
    case Card = 'card';
    case Binance = 'binance';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
