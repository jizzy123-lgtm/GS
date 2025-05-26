<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\MaintenanceRequest;

class RequestApprovedByCampusDirector extends Notification
{
    use Queueable;

    protected $maintenanceRequest;

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
        $requester = $this->maintenanceRequest->requesting_personnel;
        return (new MailMessage)
            ->subject('Maintenance Request Approved')
            ->greeting('Hello ' . optional($this->maintenanceRequest->requesting_personnel)->first_name. ' ' .
                                optional($this->maintenanceRequest->requesting_personnel)->last_name)
            ->line('Your maintenance request has been approved by the Campus Director.')
            ->line('Your request status now is Approved!')
            ->salutation('Regards, GSO SYSTEM');
    }
}
