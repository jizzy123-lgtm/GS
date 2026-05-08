<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\MaintenanceRequest;

//THIS IS FOR THE CAMPUS DIRECTOR NOTIFICATION

class RequestApprovedByHead extends Notification
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
            ->subject('Maintenance Request Awaiting Final Approval')
            ->greeting('Dear Campus Director,')
            ->line('A maintenance request has been approved by the head and is awaiting your final approval.')
            ->line('Details: ' . $this->maintenanceRequest->details)
            ->line('Requesting Personnel: ' . optional($this->maintenanceRequest->requesting_personnel)->first_name. ' ' .
                                optional($this->maintenanceRequest->requesting_personnel)->last_name)
            ->line('Office: ' . optional($this->maintenanceRequest->requesting_office)->name)
            ->line('Please log in to review and finalize the request.')
            ->salutation('Regards, GSO SYSTEM');
    }
}
