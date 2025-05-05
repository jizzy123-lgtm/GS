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

    public function __construct($requesterName)
    {
        $this->requesterName = $requesterName;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('New Maintenance Request Submitted')
            ->greeting('Hello ' . $notifiable->full_name . ',')
            ->line("A new maintenance request was submitted by {$this->requesterName}.")
            ->line('Please review the request in the system.')
            ->line('Thank you.');
    }
}
