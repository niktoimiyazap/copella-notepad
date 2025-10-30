<script lang="ts">
	import { onMount } from 'svelte';
	
	interface Props {
		user: any;
	}
	
	let { user }: Props = $props();
	
	// Appearance settings
	let theme = $state<'dark' | 'light' | 'auto'>('dark');
	let accentColor = $state('#FEB1FF');
	let fontSize = $state<'small' | 'medium' | 'large'>('medium');
	let compactMode = $state(false);
	let animationsEnabled = $state(true);
	let saving = $state(false);
	let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	
	const accentColors = [
		{ name: 'Розовый', value: '#FEB1FF' },
		{ name: 'Фиолетовый', value: '#BB86FC' },
		{ name: 'Синий', value: '#4FC3F7' },
		{ name: 'Бирюзовый', value: '#26C6DA' },
		{ name: 'Зеленый', value: '#66BB6A' },
		{ name: 'Оранжевый', value: '#FFA726' },
		{ name: 'Красный', value: '#EF5350' }
	];
	
	onMount(async () => {
		await loadAppearanceSettings();
	});
	
	async function loadAppearanceSettings() {
		try {
			const token = localStorage.getItem('session_token');
			const response = await fetch('/api/settings/appearance', {
				headers: token ? { 'Authorization': `Bearer ${token}` } : {},
				credentials: 'include'
			});
			if (response.ok) {
				const data = await response.json();
				theme = data.theme ?? 'dark';
				accentColor = data.accentColor ?? '#FEB1FF';
				fontSize = data.fontSize ?? 'medium';
				compactMode = data.compactMode ?? false;
				animationsEnabled = data.animationsEnabled ?? true;
			}
		} catch (error) {
			console.error('Failed to load appearance settings:', error);
		}
	}
	
	async function saveSettings() {
		saving = true;
		message = null;
		
		try {
			const token = localStorage.getItem('session_token');
			const response = await fetch('/api/settings/appearance', {
				method: 'PATCH',
				headers: { 
					'Content-Type': 'application/json',
					...(token ? { 'Authorization': `Bearer ${token}` } : {})
				},
				credentials: 'include',
				body: JSON.stringify({
					theme,
					accentColor,
					fontSize,
					compactMode,
					animationsEnabled
				})
			});
			
			if (response.ok) {
				message = { type: 'success', text: 'Настройки внешнего вида сохранены' };
				applySettings();
			} else {
				message = { type: 'error', text: 'Ошибка при сохранении настроек' };
			}
		} catch (error) {
			message = { type: 'error', text: 'Произошла ошибка при сохранении' };
		} finally {
			saving = false;
		}
	}
	
	function applySettings() {
		// Apply theme
		document.documentElement.setAttribute('data-theme', theme);
		
		// Apply accent color
		document.documentElement.style.setProperty('--accent-color', accentColor);
		
		// Apply font size
		const fontSizeMap = { small: '14px', medium: '16px', large: '18px' };
		document.documentElement.style.setProperty('--base-font-size', fontSizeMap[fontSize]);
		
		// Apply compact mode
		document.documentElement.classList.toggle('compact-mode', compactMode);
		
		// Apply animations
		document.documentElement.classList.toggle('no-animations', !animationsEnabled);
	}
	
	function setTheme(newTheme: 'dark' | 'light' | 'auto') {
		theme = newTheme;
		saveSettings();
	}
	
	function setAccentColor(color: string) {
		accentColor = color;
		saveSettings();
	}
	
	function setFontSize(size: 'small' | 'medium' | 'large') {
		fontSize = size;
		saveSettings();
	}
	
	function toggleSwitch(settingName: string) {
		switch (settingName) {
			case 'compact':
				compactMode = !compactMode;
				break;
			case 'animations':
				animationsEnabled = !animationsEnabled;
				break;
		}
		saveSettings();
	}
</script>

<!-- Theme selection -->
<div class="settings-section">
	<div class="settings-section-header">
		<h2 class="settings-section-title">Тема</h2>
		<p class="settings-section-description">
			Выберите тему оформления приложения
		</p>
	</div>
	
	<div class="theme-options">
		<button 
			class="theme-option" 
			class:theme-option--active={theme === 'dark'}
			onclick={() => setTheme('dark')}
		>
			<div class="theme-preview theme-preview--dark">
				<div class="theme-preview-header"></div>
				<div class="theme-preview-content">
					<div class="theme-preview-line"></div>
					<div class="theme-preview-line"></div>
					<div class="theme-preview-line"></div>
				</div>
			</div>
			<span class="theme-label">Темная</span>
		</button>
		
		<button 
			class="theme-option" 
			class:theme-option--active={theme === 'light'}
			onclick={() => setTheme('light')}
			disabled
		>
			<div class="theme-preview theme-preview--light">
				<div class="theme-preview-header"></div>
				<div class="theme-preview-content">
					<div class="theme-preview-line"></div>
					<div class="theme-preview-line"></div>
					<div class="theme-preview-line"></div>
				</div>
			</div>
			<span class="theme-label">Светлая <small>(скоро)</small></span>
		</button>
		
		<button 
			class="theme-option" 
			class:theme-option--active={theme === 'auto'}
			onclick={() => setTheme('auto')}
			disabled
		>
			<div class="theme-preview theme-preview--auto">
				<div class="theme-preview-header"></div>
				<div class="theme-preview-content">
					<div class="theme-preview-line"></div>
					<div class="theme-preview-line"></div>
					<div class="theme-preview-line"></div>
				</div>
			</div>
			<span class="theme-label">Авто <small>(скоро)</small></span>
		</button>
	</div>
</div>

<!-- Accent color -->
<div class="settings-section">
	<div class="settings-section-header">
		<h2 class="settings-section-title">Акцентный цвет</h2>
		<p class="settings-section-description">
			Выберите основной цвет для интерфейса
		</p>
	</div>
	
	<div class="color-options">
		{#each accentColors as color}
			<button 
				class="color-option" 
				class:color-option--active={accentColor === color.value}
				style="background-color: {color.value}"
				onclick={() => setAccentColor(color.value)}
				title={color.name}
			>
				{#if accentColor === color.value}
					<svg class="color-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
				{/if}
			</button>
		{/each}
	</div>
</div>

<!-- Font size -->
<div class="settings-section">
	<div class="settings-section-header">
		<h2 class="settings-section-title">Размер шрифта</h2>
		<p class="settings-section-description">
			Выберите комфортный размер текста
		</p>
	</div>
	
	<div class="font-size-options">
		<button 
			class="font-size-option" 
			class:font-size-option--active={fontSize === 'small'}
			onclick={() => setFontSize('small')}
		>
			<span class="font-size-preview" style="font-size: 14px">Aa</span>
			<span class="font-size-label">Маленький</span>
		</button>
		
		<button 
			class="font-size-option" 
			class:font-size-option--active={fontSize === 'medium'}
			onclick={() => setFontSize('medium')}
		>
			<span class="font-size-preview" style="font-size: 16px">Aa</span>
			<span class="font-size-label">Средний</span>
		</button>
		
		<button 
			class="font-size-option" 
			class:font-size-option--active={fontSize === 'large'}
			onclick={() => setFontSize('large')}
		>
			<span class="font-size-preview" style="font-size: 18px">Aa</span>
			<span class="font-size-label">Большой</span>
		</button>
	</div>
</div>

<!-- Display options -->
<div class="settings-section">
	<div class="settings-section-header">
		<h2 class="settings-section-title">Отображение</h2>
		<p class="settings-section-description">
			Настройте плотность и анимации интерфейса
		</p>
	</div>
	
	<div class="settings-toggle" onclick={() => toggleSwitch('compact')}>
		<div class="settings-toggle-info">
			<div class="settings-toggle-label">Компактный режим</div>
			<div class="settings-toggle-description">
				Уменьшить отступы для более плотного интерфейса
			</div>
		</div>
		<div class="toggle-switch" class:active={compactMode}>
			<div class="toggle-switch-handle"></div>
		</div>
	</div>
	
	<div class="settings-toggle" onclick={() => toggleSwitch('animations')}>
		<div class="settings-toggle-info">
			<div class="settings-toggle-label">Анимации</div>
			<div class="settings-toggle-description">
				Включить плавные переходы и анимации
			</div>
		</div>
		<div class="toggle-switch" class:active={animationsEnabled}>
			<div class="toggle-switch-handle"></div>
		</div>
	</div>
</div>

{#if message}
	<div class="settings-message" class:settings-message--success={message.type === 'success'} class:settings-message--error={message.type === 'error'}>
		{message.text}
	</div>
{/if}

<style>
	.theme-options {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}
	
	.theme-option {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 12px;
		background: transparent;
		border: 2px solid #3A3A3A;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.theme-option:hover:not(:disabled) {
		border-color: #4A4A4A;
	}
	
	.theme-option--active {
		border-color: #FEB1FF;
	}
	
	.theme-option:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.theme-preview {
		width: 100%;
		aspect-ratio: 16 / 10;
		border-radius: 8px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	
	.theme-preview--dark {
		background: #121212;
		border: 1px solid #2A2A2A;
	}
	
	.theme-preview--light {
		background: #ffffff;
		border: 1px solid #e0e0e0;
	}
	
	.theme-preview--auto {
		background: linear-gradient(135deg, #121212 50%, #ffffff 50%);
		border: 1px solid #2A2A2A;
	}
	
	.theme-preview-header {
		height: 24px;
		background: rgba(254, 177, 255, 0.2);
	}
	
	.theme-preview-content {
		flex: 1;
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	
	.theme-preview--dark .theme-preview-line {
		height: 4px;
		background: #3A3A3A;
		border-radius: 2px;
	}
	
	.theme-preview--light .theme-preview-line {
		height: 4px;
		background: #e0e0e0;
		border-radius: 2px;
	}
	
	.theme-preview--auto .theme-preview-line {
		height: 4px;
		background: #555555;
		border-radius: 2px;
	}
	
	.theme-label {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 14px;
		color: #ffffff;
		text-align: center;
	}
	
	.theme-label small {
		font-size: 11px;
		color: #7E7E7E;
		font-weight: 400;
	}
	
	.color-options {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}
	
	.color-option {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		border: 3px solid transparent;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.color-option:hover {
		transform: scale(1.1);
	}
	
	.color-option--active {
		border-color: #ffffff;
		transform: scale(1.15);
	}
	
	.color-check {
		width: 24px;
		height: 24px;
		color: #000000;
		filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.5));
	}
	
	.font-size-options {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}
	
	.font-size-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 16px;
		background: transparent;
		border: 2px solid #3A3A3A;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.font-size-option:hover {
		border-color: #4A4A4A;
	}
	
	.font-size-option--active {
		border-color: #FEB1FF;
		background: rgba(254, 177, 255, 0.05);
	}
	
	.font-size-preview {
		font-family: 'Gilroy', sans-serif;
		font-weight: 700;
		color: #ffffff;
	}
	
	.font-size-label {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 13px;
		color: #7E7E7E;
	}
	
	.font-size-option--active .font-size-label {
		color: #FEB1FF;
	}
	
	.settings-message {
		padding: 12px 16px;
		border-radius: 8px;
		font-family: 'Gilroy', sans-serif;
		font-size: 14px;
		margin-top: 16px;
	}
	
	.settings-message--success {
		background: rgba(46, 213, 115, 0.1);
		color: #2ed573;
		border: 1px solid rgba(46, 213, 115, 0.3);
	}
	
	.settings-message--error {
		background: rgba(255, 68, 68, 0.1);
		color: #ff4444;
		border: 1px solid rgba(255, 68, 68, 0.3);
	}
	
	@media (max-width: 768px) {
		.theme-options {
			grid-template-columns: 1fr;
		}
		
		.font-size-options {
			grid-template-columns: 1fr;
		}
	}
</style>

