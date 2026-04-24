<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\MaintenanceRequest;

class RequestApprovedByDirectorNotifyStaff extends Notification implements ShouldQueue
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
            ->subject('A Maintenance Request Has Been Approved by the Campus Director')
            ->view('emails.gso-notification', [
                'subject'    => 'A Maintenance Request Has Been Approved by the Campus Director',
                'badgeType'  => 'green',
                'badgeLabel' => 'Approved by Campus Director',
                'greeting'   => 'Dear ' . $notifiable->first_name . ',',
                'lines'      => [
                    'A maintenance request has been <strong>fully approved by the Campus Director</strong>.',
                    'Please log in and assign a priority number to this request.',
                ],
                'actionUrl'  => 'http://localhost:5173/',
                'actionText' => 'View Request',
                'notices'    => [
                    '⚠️ If you have any concerns, please contact your Campus Admin.',
                ],
            ]);
    }
}