<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    // List all comments
    public function index()
    {
        $comments = Comment::with(['user', 'role', 'request'])->get();

        return response()->json($comments);
    }

    // Store a new comment
    public function store(Request $request)
    {
        $validated = $request->validate([
            'request_id' => 'required|exists:requests,id',
            'role_id' => 'required|exists:roles,id',
            'comment' => 'required|string',
        ]);

        $comment = Comment::create([
            'request_id' => $validated['request_id'],
            'user_id' => Auth::id(), // Automatically use authenticated user
            'role_id' => $validated['role_id'],
            'date' => now()->toDateString(),
            'time' => now()->toTimeString(),
            'comment' => $validated['comment'],
        ]);

        return response()->json($comment, 201);
    }

    // Show a single comment by ID
    public function show($id)
    {
        $comment = Comment::with(['user', 'role', 'request'])->find($id);

        if (!$comment) {
            return response()->json(['message' => 'Comment not found'], 404);
        }

        return response()->json($comment);
    }

    // Update a comment
    public function update(Request $request, $id)
    {
        $comment = Comment::find($id);

        if (!$comment) {
            return response()->json(['message' => 'Comment not found'], 404);
        }

        $validated = $request->validate([
            'comment_text' => 'sometimes|required|string',
        ]);

        $comment->update($validated);

        return response()->json($comment);
    }

    // Delete a comment
    public function destroy($id)
    {
        $comment = Comment::find($id);

        if (!$comment) {
            return response()->json(['message' => 'Comment not found'], 404);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully']);
    }


    public function commentsByRequest($requestId)
    {
        $comments = Comment::with(['user', 'role'])
            ->where('request_id', $requestId)
            ->orderBy('date', 'asc')
            ->orderBy('time', 'asc')
            ->get();

        if ($comments->isEmpty()) {
            return response()->json(['message' => 'No comments found for this request.'], 404);
        }

        return response()->json($comments);
    }
}
