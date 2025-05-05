<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class AccountApproved extends Notification
{
    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Account Approved')
            ->greeting('Hello ' . $notifiable->full_name . ',')
            ->line('Good news! Your account has been approved by the admin.')
            ->line('You can now log in and start using the system.')
            ->action('Login Now', url('/')) // optional: adjust the URL
            ->line('Thank you for using our system!');
    }
}
