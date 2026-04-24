<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class MaintenanceRequestDisapprovedNotifyStaff extends Notification implements ShouldQueue
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
            ->subject('Maintenance Request Disapproved by ' . $this->role)
            ->view('emails.gso-notification', [
                'subject'    => 'Maintenance Request Disapproved by ' . $this->role,
                'badgeType'  => 'red',
                'badgeLabel' => 'Request Disapproved',
                'greeting'   => 'Dear ' . $fullName . ',',
                'lines'      => [
                    'A maintenance request has been <strong>disapproved</strong> by the <strong>' . $this->role . '</strong>.',
                    'Disapproved by: <strong>' . $this->disapprovedBy . '</strong>',
                    'Please log in to the system to view the details.',
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
            'message' => 'A maintenance request was disapproved by ' . $this->disapprovedBy,
        ];
    }
}