<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    private const API_URL = 'https://dashboard.philsms.com/api/v3/sms/send';

    public static function send(string $number, string $message): bool
    {
        try {
            $number = self::formatNumber($number);

            $response = Http::withToken(config('services.philsms.token'))
                ->acceptJson()
                ->post(self::API_URL, [
                    'recipient' => $number,
                    'sender_id' => config('services.philsms.sender_id'),
                    'type'      => 'plain',
                    'message'   => $message,
                ]);

            $body = $response->json();

            if ($response->successful() && ($body['status'] ?? '') === 'success') {
                Log::info('SMS sent successfully', [
                    'to'      => $number,
                    'message' => $message,
                ]);
                return true;
            }

            Log::warning('SMS send failed', [
                'to'       => $number,
                'response' => $body,
            ]);
            return false;

        } catch (\Exception $e) {
            Log::error('SMS send failed: ' . $e->getMessage(), [
                'to' => $number,
            ]);
            return false;
        }
    }

    private static function formatNumber(string $number): string
    {
        // +639XXXXXXXXX → 639XXXXXXXXX
        if (str_starts_with($number, '+')) {
            return substr($number, 1);
        }

        // 09XXXXXXXXX → 639XXXXXXXXX
        if (str_starts_with($number, '0')) {
            return '63' . substr($number, 1);
        }

        return $number;
    }
}