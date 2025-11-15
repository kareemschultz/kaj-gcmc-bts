"use client";

import { Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";

interface MessageInputProps {
	conversationId: number;
	onMessageSent?: () => void;
}

export function MessageInput({
	conversationId,
	onMessageSent,
}: MessageInputProps) {
	const [message, setMessage] = useState("");
	const utils = trpc.useUtils();

	const sendMessageMutation = trpc.conversations.sendMessage.useMutation({
		onSuccess: () => {
			setMessage("");
			// Invalidate queries to refresh the conversation
			utils.conversations.get.invalidate({ id: conversationId });
			utils.conversations.list.invalidate();
			utils.conversations.unreadCount.invalidate();
			if (onMessageSent) {
				onMessageSent();
			}
		},
		onError: (error) => {
			toast.error(`Failed to send message: ${error.message}`);
		},
	});

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const trimmedMessage = message.trim();
		if (!trimmedMessage) return;

		sendMessageMutation.mutate({
			conversationId,
			body: trimmedMessage,
		});
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		// Send on Enter, but allow Shift+Enter for new lines
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex gap-2">
			<textarea
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
				className="min-h-[60px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={sendMessageMutation.isPending}
			/>
			<Button
				type="submit"
				size="icon"
				disabled={!message.trim() || sendMessageMutation.isPending}
				className="h-[60px] w-[60px] flex-shrink-0"
			>
				<Send className="h-5 w-5" />
			</Button>
		</form>
	);
}
