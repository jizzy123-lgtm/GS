<?php

namespace App\Notifications;

use App\Models\MaintenanceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class MaintenanceRequestApproved extends Notification
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
            ->subject('Your Maintenance Request is Approved')
            ->greeting('Hello ' . $notifiable->full_name . ',')
            ->line('Your maintenance request has been approved by both heads.')
            ->line('Details: ' . $this->request->details)
            ->line('Priority No.: ' . $this->request->priority_number)
            ->line('Thank you for using the GSO Maintenance System!');
    }
}
