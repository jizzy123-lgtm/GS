<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;              
use Illuminate\Contracts\Queue\ShouldQueue; 
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\MaintenanceRequest;

class RequestApprovedByCampusDirector extends Notification implements ShouldQueue
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
            ->subject('Request Approved by Campus Director')
            ->view('emails.gso-notification', [
                'subject'    => 'Request Approved by Campus Director',
                'badgeType'  => 'green',
                'badgeLabel' => 'Director Approved',
                'greeting'   => 'Dear ' . $notifiable->first_name . ',',
                'lines'      => [
                    'Your request has been <strong>approved by the Campus Director</strong> in the <strong>General Service Office System</strong>.',
                    'Please log in to your account to view further details.',
                ],
                'actionUrl'  => 'http://localhost:5173/',
                'actionText' => 'View Request',
                'notices'    => [
                    '⚠️ If you have any concerns, please contact your Campus Admin.',
                ],
            ]);
    }
}
