export { default as Sidebar } from './layout/Sidebar.svelte';
export { default as Teleprompter } from './Teleprompter.svelte';
export { default as MentionHighlight } from './MentionHighlight.svelte';
export { default as CodeInput } from './CodeInput.svelte';
export { default as RegisterStep1 } from './RegisterStep1.svelte';

// Settings components
export * from './settings';
export { default as RegisterStep2 } from './forms/RegisterStep2.svelte';
export * from './home';
// Note: Header is not exported here to avoid circular dependency with modals
// Import Header directly: import Header from '$lib/components/layout/header/Header.svelte';
export * from './ui/modals';
export * from './room';
