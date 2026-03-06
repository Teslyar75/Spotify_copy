import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ChatPage = () => {
	const {
		users,
		selectedUser,
		messages,
		isLoading,
		fetchUsers,
		fetchMessages,
		sendMessage,
		setSelectedUser,
		isChatOpen,
		toggleChat,
	} = useChatStore();
	const { user } = useAuthStore();
	const [inputMessage, setInputMessage] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (user) {
			fetchUsers();
		}
	}, [user, fetchUsers]);

	useEffect(() => {
		if (selectedUser) {
			fetchMessages(selectedUser.id);
		}
	}, [selectedUser, fetchMessages]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSendMessage = () => {
		if (!inputMessage.trim() || !selectedUser) return;
		sendMessage(selectedUser.id, inputMessage.trim());
		setInputMessage("");
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	if (!isChatOpen) return null;

	return (
		<div className='fixed bottom-24 right-4 w-96 h-[500px] bg-zinc-900 rounded-lg shadow-2xl border border-zinc-800 flex flex-col z-50'>
			{/* Header */}
			<div className='flex items-center justify-between p-4 border-b border-zinc-800'>
				<div className='flex items-center gap-3'>
					{selectedUser ? (
						<>
							<Avatar className='h-8 w-8'>
								<AvatarImage src={selectedUser.avatar_url || ""} />
								<AvatarFallback>{selectedUser.username[0].toUpperCase()}</AvatarFallback>
							</Avatar>
							<span className='font-semibold'>{selectedUser.username}</span>
						</>
					) : (
						<span className='font-semibold'>Messages</span>
					)}
				</div>
				<div className='flex gap-2'>
					{selectedUser && (
						<Button variant='ghost' size='sm' onClick={() => setSelectedUser(null)}>
							Back
						</Button>
					)}
					<Button variant='ghost' size='icon' onClick={toggleChat}>
						<X className='h-4 w-4' />
					</Button>
				</div>
			</div>

			{/* Users List or Chat */}
			{!selectedUser ? (
				<ScrollArea className='flex-1'>
					<div className='p-4 space-y-2'>
						{users.map((u) => (
							<div
								key={u.id}
								className='flex items-center gap-3 p-3 hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors'
								onClick={() => setSelectedUser(u)}
							>
								<Avatar className='h-10 w-10'>
									<AvatarImage src={u.avatar_url || ""} />
									<AvatarFallback>{u.username[0].toUpperCase()}</AvatarFallback>
								</Avatar>
								<div className='flex-1'>
									<p className='font-medium'>{u.username}</p>
									<p className='text-xs text-zinc-400'>
										{u.activity?.replace("Playing ", "") || "Idle"}
									</p>
								</div>
								{u.is_online && (
									<div className='h-2 w-2 bg-green-500 rounded-full' />
								)}
							</div>
						))}
					</div>
				</ScrollArea>
			) : (
				<>
					<ScrollArea className='flex-1 p-4'>
						<div className='space-y-4'>
							{messages.map((message) => {
								const isOwn = message.sender_id === user?.id;
								return (
									<div
										key={message.id}
										className={cn(
											"flex",
											isOwn ? "justify-end" : "justify-start"
										)}
									>
										<div
											className={cn(
												"max-w-[80%] p-3 rounded-lg",
												isOwn
													? "bg-green-600 text-white"
													: "bg-zinc-800 text-zinc-100"
											)}
										>
											<p className='text-sm'>{message.content}</p>
											<p
												className={cn(
													"text-xs mt-1",
													isOwn ? "text-green-100" : "text-zinc-400"
												)}
											>
												{new Date(message.created_at).toLocaleTimeString()}
											</p>
										</div>
									</div>
								);
							})}
							<div ref={messagesEndRef} />
						</div>
					</ScrollArea>

					<div className='p-4 border-t border-zinc-800'>
						<div className='flex gap-2'>
							<Input
								value={inputMessage}
								onChange={(e) => setInputMessage(e.target.value)}
								onKeyPress={handleKeyPress}
								placeholder='Type a message...'
								className='flex-1 bg-zinc-800 border-zinc-700'
							/>
							<Button
								size='icon'
								onClick={handleSendMessage}
								disabled={!inputMessage.trim()}
								className='bg-green-600 hover:bg-green-700'
							>
								<Send className='h-4 w-4' />
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default ChatPage;
