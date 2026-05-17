<?php

namespace App\Notifications;

use App\Models\MaintenanceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class MaintenanceRequestDone extends Notification
{
    use Queueable;

    public $request;

    public function __construct(MaintenanceRequest $request)
    {
        $this->request = $request;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Your Maintenance Request is Done')
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line('Your maintenance request has been marked as done.')
            ->line('Details: ' . $this->request->details)
            ->line('Kindly log in to the system and provide your feedback to help us improve our service.')
            ->line('Thank you for using the GSO Maintenance System!')
            ->salutation('Regards, GSO SYSTEM');
    }
}
