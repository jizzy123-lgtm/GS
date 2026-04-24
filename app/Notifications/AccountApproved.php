<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;              
use Illuminate\Contracts\Queue\ShouldQueue; 
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class AccountApproved extends Notification implements ShouldQueue 
{   
    use Queueable;
    
    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
        ->subject('Account Registration Approved')
        ->view('emails.gso-notification', [
            'subject'    => 'Account Registration Approved',
            'badgeType'  => 'green',
            'badgeLabel' => 'Account Approved',
            'greeting'   => 'Dear ' . $notifiable->first_name . ',',
            'lines'      => [
                'We are pleased to inform you that your account registration for the <strong>General Service Office System</strong> has been <strong>approved</strong>.',
                'You may now log in using your registered credentials.',
            ],
            'actionUrl'  => 'http://localhost:5173/',
            'actionText' => 'Login Now',
            'notices'    => [
                '🔒 For security reasons, do not share your login credentials with anyone.',
                '⚠️ If you experience any issues, please contact your Campus Admin.',
            ],
        ]);
    }
}
