<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class NewUserRegistered extends Notification implements ShouldQueue
{
    use Queueable;

    public $user;

    public function __construct($user)
    {
        $this->user = $user;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New User Registration Request')
            ->view('emails.gso-notification', [
                'subject'    => 'New User Registration Request',
                'badgeType'  => 'purple',
                'badgeLabel' => 'New Registration',
                'greeting'   => 'Dear Admin,',
                'lines'      => [
                    'A new user has submitted a registration request for the <strong>General Service Office System</strong>.',
                    '<strong>Name:</strong> ' . $this->user->first_name . ' ' . $this->user->last_name,
                    'Please review and take the appropriate action.',
                ],
                'actionUrl'  => 'http://localhost:5173/admin/users',
                'actionText' => 'Review Request',
                'notices'    => [],
            ]);
    }
}