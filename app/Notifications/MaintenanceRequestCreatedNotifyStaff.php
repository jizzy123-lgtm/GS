<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\MaintenanceRequest;

class MaintenanceRequestCreatedNotifyStaff extends Notification implements ShouldQueue
{
    use Queueable;

    public $maintenanceRequest;
    public $requesterName;

    public function __construct(MaintenanceRequest $maintenanceRequest, string $requesterName)
    {
        $this->maintenanceRequest = $maintenanceRequest;
        $this->requesterName = $requesterName;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Maintenance Request Submitted')
            ->view('emails.gso-notification', [
                'subject'    => 'New Maintenance Request Submitted',
                'badgeType'  => 'blue',
                'badgeLabel' => 'New Request',
                'greeting'   => 'Dear ' . $notifiable->first_name . ' ' . $notifiable->last_name . ',',
                'lines'      => [
                    'A new maintenance request has been submitted by <strong>' . $this->requesterName . '</strong>.',
                    'Please log in to the system to review and process the request.',
                ],
                'actionUrl'  => 'http://localhost:5173/',
                'actionText' => 'View Request',
                'notices'    => [
                    '⚠️ Please review and verify this request at your earliest convenience.',
                ],
            ]);
    }
}