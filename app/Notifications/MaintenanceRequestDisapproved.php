<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\User;

class MaintenanceRequestDisapproved extends Notification implements ShouldQueue
{
    use Queueable;

    public string $disapprovedBy;
    public string $role;

    public function __construct(string $disapprovedBy, string $role)
    {
        $this->disapprovedBy = $disapprovedBy;
        $this->role          = $role;
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $fullName = trim(
            ($notifiable->last_name ? $notifiable->last_name . ', ' : '') .
            ($notifiable->first_name ?? '') . ' ' .
            ($notifiable->middle_name ?? '')
        );

        return (new MailMessage)
            ->subject('Your Maintenance Request Has Been Disapproved')
            ->view('emails.gso-notification', [
                'subject'    => 'Your Maintenance Request Has Been Disapproved',
                'badgeType'  => 'red',
                'badgeLabel' => 'Request Disapproved',
                'greeting'   => 'Dear ' . $fullName . ',',
                'lines'      => [
                    'We regret to inform you that your maintenance request has been <strong>disapproved</strong> by the <strong>' . $this->role . '</strong>.',
                    'Disapproved by: <strong>' . $this->disapprovedBy . '</strong>',
                    'Please log in to your account to view the reason for disapproval.',
                ],
                'actionUrl'  => 'http://localhost:5173/',
                'actionText' => 'View Request',
                'notices'    => [
                    '⚠️ If you have any concerns, please contact your Campus Admin.',
                ],
            ]);
    }

    public function toArray($notifiable): array
    {
        return [
            'message' => 'Your maintenance request was disapproved by ' . $this->disapprovedBy,
        ];
    }
}