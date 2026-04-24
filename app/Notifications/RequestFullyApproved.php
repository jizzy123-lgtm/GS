<?php

namespace App\Notifications;

use App\Models\MaintenanceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class RequestFullyApproved extends Notification implements ShouldQueue
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
                'greeting'   => 'Dear ' . $notifiable->first_name . ',',
                'lines'      => [
                    'Your maintenance request has been <strong>fully approved</strong> by both the <strong>Head of GSO</strong> and the <strong>Campus Director</strong>.',
                    'Request ID: <strong>' . $this->request->id . '</strong>',
                    'Details: <strong>' . $this->request->details . '</strong>',
                    'Please wait for the scheduling of your maintenance service.',
                ],
                'actionUrl'  => 'http://localhost:5173/',
                'actionText' => 'View Request',
                'notices'    => [
                    '⚠️ If you have any concerns, please contact your Campus Admin.',
                ],
            ]);
    }
}