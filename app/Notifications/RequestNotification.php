<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;              
use Illuminate\Contracts\Queue\ShouldQueue; 
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class RequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private $request;
    private $message;

    public function __construct($request, $message)
    {
        $this->request = $request;
        $this->message = $message;
    }

    public function via($notifiable)
    {
        return ['database']; // Store in database
    }

    public function toArray($notifiable)
    {
        return [
            'message' => $this->message,
            'request_id' => $this->request->id,
            'request_type' => $this->request->request_type,
            'status' => $this->request->status,
            'date_requested' => $this->request->date_requested,
        ];
    }
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Request Status Update')
            ->view('emails.gso-notification', [
                'subject'    => 'Request Status Update',
                'badgeType'  => 'blue',
                'badgeLabel' => 'Status Update',
                'greeting'   => 'Dear ' . $notifiable->first_name . ',',
                'lines'      => [
                    'There is an update regarding your request in the <strong>General Service Office System</strong>.',
                    $this->message,
                    'Please log in to your account to view the latest status.',
                ],
                'actionUrl'  => 'http://localhost:5173/',
                'actionText' => 'View Update',
                'notices'    => [
                    '⚠️ If you have any concerns, please contact your Campus Admin.',
                ],
            ]);
    }
}
