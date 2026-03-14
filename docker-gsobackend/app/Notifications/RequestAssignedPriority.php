<?php
namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\MaintenanceRequest;

class RequestAssignedPriority extends Notification
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
        $request = $this->maintenanceRequest;

        return (new MailMessage)
            ->subject('Priority Number Assigned to Your Request')
            ->greeting('Hello ' . optional($this->maintenanceRequest->requesting_personnel)->first_name. ',')
            ->line('Your maintenance request has been approved and assigned a priority number.')
            ->line('Priority Number: ' . $request->priority_number)
            ->line('Thank you for your patience and for using our system.')
            ->salutation('Regards, GSO SYSTEM');
    }
}

