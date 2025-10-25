import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		external: ['@mojs/core', '@prisma/client', 'prisma']
	},
	optimizeDeps: {
		exclude: ['@prisma/client']
	}
});
