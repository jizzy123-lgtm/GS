<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\MaintenanceRequest;

class AssignPriorityToRequest extends Notification
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
        return (new MailMessage)
            ->subject('Assign Priority to Maintenance Request')
            ->greeting('Hello ' .optional($this->maintenanceRequest->verified_by)->first_name . ',')
            ->line('A maintenance request has been approved by the Campus Director and now requires a priority assignment.')

            ->line('Please assign the appropriate priority number at your earliest convenience.')
            ->salutation('Regards, GSO SYSTEM');
    }
}
