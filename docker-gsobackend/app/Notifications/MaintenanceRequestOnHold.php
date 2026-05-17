<?php

namespace App\Notifications;

use App\Models\MaintenanceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class MaintenanceRequestOnHold extends Notification
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
            ->subject('Your Maintenance Request is On Hold')
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line('Your maintenance request has been marked as on hold.')
            ->line('Details: ' . $this->request->details)
            ->line('Please check the system for any comments or updates regarding this status.')
            ->line('Thank you for using the GSO Maintenance System!')
            ->salutation('Regards, GSO SYSTEM');
    }
}
