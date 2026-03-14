<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class NewUserRegistered extends Notification
{
    protected $newUser;

    public function __construct(User $newUser)
    {
        $this->newUser = $newUser;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('New User Registration')
            ->greeting('Hello ' . $notifiable->full_name . ',')
            ->line('A new user has registered and is awaiting approval.')
            ->line('Name: ' . $this->newUser->full_name)
            ->line('Position: ' . $this->newUser->position)
            ->line('Office: ' . $this->newUser->office)
            ->line('Please review and approve the account if appropriate.');
    }
}
