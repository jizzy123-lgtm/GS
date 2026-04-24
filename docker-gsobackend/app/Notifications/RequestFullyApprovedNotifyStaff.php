<?php

namespace App\Notifications;

use App\Models\MaintenanceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class RequestFullyApprovedNotifyStaff extends Notification implements ShouldQueue
{
    use Queueable;

    public $request;

    public function __construct(MaintenanceRequest $request)
    {
        $this->request = $request;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Maintenance Request Fully Approved')
            ->view('emails.gso-notification', [
                'subject'    => 'Maintenance Request Fully Approved',
                'badgeType'  => 'green',
                'badgeLabel' => 'Fully Approved',
                'lines'      => [
                    'A maintenance request by <strong>' . $this->requesterName . '</strong> has been <strong>fully approved</strong> by both the <strong>Head of GSO</strong> and the <strong>Campus Director</strong>.',
                    'Please proceed with the necessary actions for scheduling and service.',
                ],
                'actionUrl'  => 'http://localhost:5173/',
                'actionText' => 'View Request',
                'notices'    => [
                    '⚠️ Please assign a schedule for this request as soon as possible.',
                ],
            ]);
    }
}