<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\MaintenanceRequest;

class RequestAssignedPriority extends Notification implements ShouldQueue
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

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
        ->subject('Your Request Has Been Assigned a Priority')
        ->view('emails.gso-notification', [
            'subject'    => 'Your Request Has Been Assigned a Priority',
            'badgeType'  => 'yellow',
            'badgeLabel' => 'Priority Assigned',
            'greeting'   => 'Dear ' . $notifiable->first_name . ',',
            'lines'      => [
                'Your request in the <strong>General Service Office System</strong> has been assigned a priority level.',
                'Please log in to your account to check the status and details.',
            ],
            'actionUrl'  => url('/'),
            'actionText' => 'View Request',
            'notices'    => [
                '⚠️ If you have any concerns, please contact your Campus Admin.',
            ],
        ]);
    }
        
}