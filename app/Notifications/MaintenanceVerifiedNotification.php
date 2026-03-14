<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\MaintenanceRequest;

class MaintenanceVerifiedNotification extends Notification
{
    use Queueable;

    public $maintenanceRequest;

    public function __construct(MaintenanceRequest $maintenanceRequest)
    {
        $this->maintenanceRequest = $maintenanceRequest;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('✅ Your Maintenance Request Was Verified')
            ->greeting('Hello ' . $notifiable->full_name . '!')
            ->line('Your maintenance request has been verified by our staff.')
            ->line('Details:')
            ->line('• Date Requested: ' . $this->maintenanceRequest->date_requested)
            ->line('• Details: ' . $this->maintenanceRequest->details)
            ->line('• Status: ' . $this->maintenanceRequest->status)
            ->line('We’ll notify you again once it’s approved.')
            ->salutation('Thank you for using GSO System!');
    }
}
