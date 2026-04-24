<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\MaintenanceRequest;
use App\Models\User;

class MaintenanceVerifiedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public MaintenanceRequest $maintenanceRequest;
    public User $requester;

    public function __construct(MaintenanceRequest $maintenanceRequest, User $requester)
    {
        $this->maintenanceRequest = $maintenanceRequest;
        $this->requester = $requester;
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $fullName = trim(
            ($this->requester->last_name ? $this->requester->last_name . ', ' : '') .
            ($this->requester->first_name ?? '') . ' ' .
            ($this->requester->middle_name ?? '')
        );

        return (new MailMessage)
            ->subject('Your Maintenance Request Has Been Verified')
            ->view('emails.gso-notification', [
                'subject'    => 'Your Maintenance Request Has Been Verified',
                'badgeType'  => 'green',                    // ✅ different color from "submitted"
                'badgeLabel' => 'Request Verified',         // ✅ NOT "Request Submitted"
                'greeting'   => 'Dear ' . $fullName . ',',  // ✅ requester's actual name
                'lines'      => [
                    'Your maintenance request <strong>(ID: #' . $this->maintenanceRequest->id . ')</strong> has been <strong>verified by our staff</strong>.',
                    'Your request will now be forwarded to the <strong>Head of GSO</strong> for approval.',
                    'Please log in to your account to view further details.',
                ],
                'actionUrl'  => 'http://localhost:5173/',
                'actionText' => 'View Request',
                'notices'    => [
                    '⚠️ If you have any concerns, please contact your Campus Admin.',
                ],
            ]);
    }

    // ✅ Required if database channel is ever added
    public function toArray($notifiable): array
    {
        return [
            'request_id' => $this->maintenanceRequest->id,
            'message'    => 'Your maintenance request has been verified by staff.',
        ];
    }
}