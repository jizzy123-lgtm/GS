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
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line('A new user has registered and is awaiting approval.')
            ->line('Name: ' . $this->newUser->first_name)
            ->line('Position: ' . optional($this->newUser->position)->name)
            ->line('Office: ' . optional($this->newUser->office)->name)
            ->line('Please review and approve the account if appropriate.')
            ->salutation('Regards, GSO SYSTEM');
    }
}
