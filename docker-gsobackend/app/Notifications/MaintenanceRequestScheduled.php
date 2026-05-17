<?php

namespace App\Notifications;

use App\Models\MaintenanceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class MaintenanceRequestScheduled extends Notification
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
            ->subject('Your Maintenance Request has been Scheduled')
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line('Your maintenance request has been scheduled.')
            ->line('Scheduled Date: ' . $this->request->scheduled_date)
            ->line('Scheduled Time: ' . $this->request->scheduled_time)
            ->line('Details: ' . $this->request->details)
            ->line('Thank you for using the GSO Maintenance System!')
            ->salutation('Regards, GSO SYSTEM');
    }
}
