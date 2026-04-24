<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;              
use Illuminate\Contracts\Queue\ShouldQueue; 
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountRejected extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        // pass data here if needed
    }

    public function via(object $notifiable): array
    {
        return ['mail']; // sends via email
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Account Registration Disapproved')
            ->view('emails.gso-notification', [
                'subject'    => 'Account Registration Disapproved',
                'badgeType'  => 'red',
                'badgeLabel' => 'Account Disapproved',
                'greeting'   => 'Dear ' . $notifiable->first_name . ',',
                'lines'      => [
                    'We would like to inform you that your account registration for the <strong>General Service Office System</strong> has been reviewed.',
                    'After careful consideration, your request has been <strong>disapproved</strong>.',
                    'Please reach out to your Campus Admin to understand the reason and discuss possible next steps.',
                ],
                'actionUrl'  => null,
                'actionText' => null,
                'notices'    => [
                    '🔒 Do not share your credentials with anyone.',
                    '⚠️ Contact your Campus Admin for further assistance.',
                ],
            ]);
    }
}