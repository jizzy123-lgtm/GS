<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;


class MaintenanceRequestCreated extends Notification implements ShouldQueue
{
    use Queueable;

    public $requesterName;

    public function __construct()
    {
       
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Maintenance Request Successfully Created')
            ->view('emails.gso-notification', [
                'subject'    => 'Maintenance Request Successfully Created',
                'badgeType'  => 'blue',
                'badgeLabel' => 'Request Submitted',
                'greeting'   => 'Dear ' . $notifiable->first_name . ',',
                'lines'      => [
                    'Your maintenance request has been successfully submitted to the <strong>General Service Office System</strong>.',
                    'Your request is currently under review. You will be notified once it has been processed.',
                ],
                'actionUrl'  => 'http://localhost:5173/',
                'actionText' => 'Track Request',
                'notices'    => [
                    '⚠️ If you have any concerns, please contact your Campus Admin.',
                ],
            ]);
    }
}
