<?php

namespace App\Notifications;

use App\Models\Feedback;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class FeedbackSubmitted extends Notification implements ShouldQueue
{
    use Queueable;

    public $feedback;

    public function __construct(Feedback $feedback)
    {
        $this->feedback = $feedback;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Feedback Successfully Submitted')
            ->view('emails.gso-notification', [
                'subject'    => 'Feedback Successfully Submitted',
                'badgeType'  => 'green',
                'badgeLabel' => 'Feedback Received',
                'greeting'   => 'Dear ' . $notifiable->first_name . ',',
                'lines'      => [
                    'Your feedback has been successfully submitted to the <strong>General Service Office System</strong>.',
                    'Thank you for helping us improve our services.',
                ],
                'actionUrl'  => null,
                'actionText' => null,
                'notices'    => [
                    '⚠️ If you have further concerns, please contact your Campus Admin.',
                ],
            ]);
    }
}

