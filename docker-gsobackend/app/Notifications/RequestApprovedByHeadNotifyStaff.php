<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\MaintenanceRequest;

class RequestApprovedByHeadNotifyStaff extends Notification implements ShouldQueue
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
            ->subject('A Maintenance Request Has Been Approved by the Head')
            ->view('emails.gso-notification', [
                'subject'    => 'A Maintenance Request Has Been Approved by the Head',
                'badgeType'  => 'blue',
                'badgeLabel' => 'Approved by Head',
                'greeting'   => 'Dear ' . $notifiable->first_name . ',',
                'lines'      => [
                    'A maintenance request has been <strong>approved by the Head of GSO</strong> and is now awaiting Campus Director approval.',
                    'Please log in to monitor the status of this request.',
                ],
                'actionUrl'  => 'http://localhost:5173/',
                'actionText' => 'View Request',
                'notices'    => [
                    '⚠️ If you have any concerns, please contact your Campus Admin.',
                ],
            ]);
    }
}