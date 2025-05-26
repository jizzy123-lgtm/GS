<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\MaintenanceRequest;


//this is for the head


class RequestVerifiedByStaff extends Notification
{
    protected $request;

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
            ->subject('Maintenance Request Verified by Staff')
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line('A maintenance request has been verified by a staff member.')
            ->line('Request: ' . $this->request->details)
            ->line('Verified By: ' . optional($this->request->verified_by)->first_name)
            ->line('Remarks: ' . $this->request->remarks)
            ->line('Please review the request and proceed with approval.')
            ->salutation('Regards, GSO SYSTEM');
    }
}
