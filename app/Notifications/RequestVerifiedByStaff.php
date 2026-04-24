<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;              
use Illuminate\Contracts\Queue\ShouldQueue; 
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\MaintenanceRequest;

class RequestVerifiedByStaff extends Notification implements ShouldQueue
{
    use Queueable;
    
    protected $request;

    public function __construct(MaintenanceRequest $request)
    {
        $this->request = $request->load('requester'); 
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        // ✅ Head's name
        $headName = trim(
            ($notifiable->last_name ? $notifiable->last_name . ', ' : '') .
            ($notifiable->first_name ?? '')
        );

        // ✅ Requester's name with null safety
        $requester = $this->request->requester;
        $requesterName = $requester
            ? trim(
                ($requester->last_name ? $requester->last_name . ', ' : '') .
                ($requester->first_name ?? '')
              )
            : 'Unknown';

        return (new MailMessage)
            ->subject('A Maintenance Request Has Been Verified')
            ->view('emails.gso-notification', [
                'subject'    => 'A Maintenance Request Has Been Verified',
                'badgeType'  => 'blue',
                'badgeLabel' => 'Staff Verified',
                'greeting'   => 'Dear ' . $headName . ',',
                'lines'      => [
                    'A maintenance request submitted by <strong>' . $requesterName . '</strong> has been <strong>verified by staff</strong> and is now awaiting your approval.',
                    'Please log in to your account to review and take action on the request.',
                ],
                'actionUrl'  => 'http://localhost:5173/',
                'actionText' => 'Review Request',
                'notices'    => [
                    '⚠️ If you have any concerns, please contact your Campus Admin.',
                ],
            ]);
    }
}