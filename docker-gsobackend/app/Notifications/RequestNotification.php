<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class RequestNotification extends Notification
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
}
