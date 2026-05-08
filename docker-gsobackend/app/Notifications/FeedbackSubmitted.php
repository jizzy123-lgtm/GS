<?php

namespace App\Notifications;

use App\Models\Feedback;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class FeedbackSubmitted extends Notification
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

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('New Feedback Submitted')
            ->greeting('Hello Staff,')
            ->line('A requester has submitted feedback for a maintenance request.')
            ->line('Service Availed: ' . $this->feedback->service_availed)
            ->line('Office Visited: ' . $this->feedback->office_visited)
            ->line('Submitted by User ID: ' . $this->feedback->user_id)
            ->line('You may log in to view the full details.')
            ->salutation('Regards, GSO System');
    }
}

