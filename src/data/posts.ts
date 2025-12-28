export interface BlogPost {
	id: string;
	title: string;
	description: string;
	date: string;
	tags: string[];
	content: string;
	image?: string;
	videoUrl?: string;
}

export const posts: BlogPost[] = [
	{
		id: 'first-post',
		title: 'My First Project',
		description: 'An exciting new project I just completed',
		date: '2025-12-20',
		tags: ['project', 'web', 'astro'],
		content: 'This is where the full content of your blog post would go. It can include text, images, and videos.',
		image: '/images/project1.jpg',
	},
	{
		id: 'second-post',
		title: 'Learning Astro',
		description: 'My journey learning Astro framework',
		date: '2025-12-15',
		tags: ['learning', 'astro'],
		content: 'Astro is a fantastic framework for building fast websites. Here are my thoughts on getting started.',
		videoUrl: 'https://example.com/video',
	},
	{
		id: 'third-post',
		title: 'Web Design Tips',
		description: 'Some tips I learned about modern web design',
		date: '2025-12-10',
		tags: ['design', 'web'],
		content: 'Here are some practical web design tips that have helped me create better websites.',
		image: '/images/design.jpg',
	},
];
