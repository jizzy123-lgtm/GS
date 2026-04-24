<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;              
use Illuminate\Contracts\Queue\ShouldQueue; 
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\MaintenanceRequest;

//THIS IS FOR THE CAMPUS DIRECTOR NOTIFICATION

class RequestApprovedByHead extends Notification implements ShouldQueue
{
    use Queueable;

    public $maintenanceRequest;

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
            ->subject('Request Approved by Head')
            ->view('emails.gso-notification', [
                'subject'    => 'Request Approved by Head',
                'badgeType'  => 'green',
                'badgeLabel' => 'Head Approved',
                'greeting'   => 'Dear ' . $notifiable->first_name . ',',
                'lines'      => [
                    'Your request has been <strong>approved by the Head</strong> in the <strong>General Service Office System</strong>.',
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
