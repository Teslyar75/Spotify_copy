const NotFoundPage = () => {
	return (
		<div className='h-screen w-screen flex items-center justify-center bg-black text-white'>
			<div className='text-center'>
				<h1 className='text-6xl font-bold mb-4'>404</h1>
				<p className='text-xl text-zinc-400 mb-8'>Page not found</p>
				<a href='/' className='text-green-500 hover:underline'>
					Go back home
				</a>
			</div>
		</div>
	);
};

export default NotFoundPage;
