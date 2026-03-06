import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Music, Disc } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Album, Song } from "@/types";

const AdminPage = () => {
	const { user } = useAuthStore();
	const { albums, fetchAlbums } = useMusicStore();
	const [isSongDialogOpen, setIsSongDialogOpen] = useState(false);
	const [isAlbumDialogOpen, setIsAlbumDialogOpen] = useState(false);

	// Form states
	const [songForm, setSongForm] = useState({
		title: "",
		artist: "",
		album_id: "",
		image_url: "",
		file_url: "",
		duration: 0,
	});

	const [albumForm, setAlbumForm] = useState({
		title: "",
		artist: "",
		image_url: "",
		release_year: new Date().getFullYear(),
	});

	useEffect(() => {
		fetchAlbums();
	}, [fetchAlbums]);

	const handleCreateSong = async (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: API call to create song
		console.log("Creating song:", songForm);
		setIsSongDialogOpen(false);
		setSongForm({
			title: "",
			artist: "",
			album_id: "",
			image_url: "",
			file_url: "",
			duration: 0,
		});
	};

	const handleCreateAlbum = async (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: API call to create album
		console.log("Creating album:", albumForm);
		setIsAlbumDialogOpen(false);
		setAlbumForm({
			title: "",
			artist: "",
			image_url: "",
			release_year: new Date().getFullYear(),
		});
	};

	return (
		<div className='h-screen bg-zinc-900 text-white'>
			<div className='p-6 border-b border-zinc-800'>
				<h1 className='text-3xl font-bold mb-2'>Admin Dashboard</h1>
				<p className='text-zinc-400'>Manage your music library</p>
			</div>

			<ScrollArea className='h-[calc(100vh-150px)]'>
				<div className='p-6 space-y-8'>
					{/* Quick Actions */}
					<div className='flex gap-4'>
						<Dialog open={isSongDialogOpen} onOpenChange={setIsSongDialogOpen}>
							<DialogTrigger asChild>
								<Button className='bg-green-600 hover:bg-green-700'>
									<Music className='mr-2 h-4 w-4' />
									Add Song
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Add New Song</DialogTitle>
								</DialogHeader>
								<form onSubmit={handleCreateSong} className='space-y-4'>
									<Input
										placeholder='Title'
										value={songForm.title}
										onChange={(e) =>
											setSongForm({ ...songForm, title: e.target.value })
										}
										required
									/>
									<Input
										placeholder='Artist'
										value={songForm.artist}
										onChange={(e) =>
											setSongForm({ ...songForm, artist: e.target.value })
										}
										required
									/>
									<Input
										placeholder='Image URL'
										value={songForm.image_url}
										onChange={(e) =>
											setSongForm({ ...songForm, image_url: e.target.value })
										}
										required
									/>
									<Input
										placeholder='Audio URL'
										value={songForm.file_url}
										onChange={(e) =>
											setSongForm({ ...songForm, file_url: e.target.value })
										}
										required
									/>
									<Input
										type='number'
										placeholder='Duration (seconds)'
										value={songForm.duration}
										onChange={(e) =>
											setSongForm({
												...songForm,
												duration: parseInt(e.target.value) || 0,
											})
										}
										required
									/>
									<Button type='submit' className='w-full'>
										Create Song
									</Button>
								</form>
							</DialogContent>
						</Dialog>

						<Dialog open={isAlbumDialogOpen} onOpenChange={setIsAlbumDialogOpen}>
							<DialogTrigger asChild>
								<Button className='bg-blue-600 hover:bg-blue-700'>
									<Disc className='mr-2 h-4 w-4' />
									Add Album
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Add New Album</DialogTitle>
								</DialogHeader>
								<form onSubmit={handleCreateAlbum} className='space-y-4'>
									<Input
										placeholder='Title'
										value={albumForm.title}
										onChange={(e) =>
											setAlbumForm({ ...albumForm, title: e.target.value })
										}
										required
									/>
									<Input
										placeholder='Artist'
										value={albumForm.artist}
										onChange={(e) =>
											setAlbumForm({ ...albumForm, artist: e.target.value })
										}
										required
									/>
									<Input
										placeholder='Image URL'
										value={albumForm.image_url}
										onChange={(e) =>
											setAlbumForm({ ...albumForm, image_url: e.target.value })
										}
										required
									/>
									<Input
										type='number'
										placeholder='Release Year'
										value={albumForm.release_year}
										onChange={(e) =>
											setAlbumForm({
												...albumForm,
												release_year: parseInt(e.target.value) || new Date().getFullYear(),
											})
										}
										required
									/>
									<Button type='submit' className='w-full'>
										Create Album
									</Button>
								</form>
							</DialogContent>
						</Dialog>
					</div>

					{/* Albums List */}
					<div>
						<h2 className='text-xl font-bold mb-4'>Albums</h2>
						<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
							{albums.map((album) => (
								<Card key={album.id} className='bg-zinc-800 border-zinc-700'>
									<CardContent className='p-4'>
										<img
											src={album.image_url || "/album-placeholder.png"}
											alt={album.title}
											className='aspect-square object-cover rounded mb-3'
										/>
										<h3 className='font-semibold truncate'>{album.title}</h3>
										<p className='text-sm text-zinc-400 truncate'>{album.artist}</p>
										<p className='text-xs text-zinc-500 mt-1'>{album.release_year}</p>
										<p className='text-xs text-zinc-500'>{album.songs.length} songs</p>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</div>
			</ScrollArea>
		</div>
	);
};

export default AdminPage;
