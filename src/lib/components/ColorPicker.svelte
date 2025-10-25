<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { Palette } from '@lucide/svelte';

	interface Props {
		disabled?: boolean;
	}

	let { disabled = false }: Props = $props();

	const dispatch = createEventDispatcher<{
		colorChange: { color: string };
	}>();

	let isOpen = $state(false);
	let hue = $state(0); // 0-360
	let saturation = $state(100); // 0-100
	let value = $state(100); // 0-100
	let selectedColor = $state('#FFFFFF');

	let svPickerElement = $state<HTMLDivElement>();
	let hueSliderElement = $state<HTMLDivElement>();
	let isDraggingSV = $state(false);
	let isDraggingHue = $state(false);

	// Палитра предустановленных цветов для мобильных
	const presetColors = [
		'#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
		'#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
		'#FFC0CB', '#A52A2A', '#808080', '#FF6347', '#4B0082',
		'#FFD700', '#90EE90', '#87CEEB', '#FF1493', '#32CD32'
	];

	let isMobile = $state(false);
	let pickerButton: HTMLButtonElement | undefined = $state();
	let dropdownTop = $state(0);
	let dropdownRight = $state(0);

	function checkIfMobile() {
		isMobile = window.innerWidth <= 768;
	}

	function updateDropdownPosition() {
		if (isMobile && pickerButton) {
			const rect = pickerButton.getBoundingClientRect();
			dropdownTop = rect.bottom + 4;
			dropdownRight = window.innerWidth - rect.right;
		}
	}

	// Конвертация HSV в RGB
	function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
		h = h / 360;
		s = s / 100;
		v = v / 100;

		let r = 0, g = 0, b = 0;
		const i = Math.floor(h * 6);
		const f = h * 6 - i;
		const p = v * (1 - s);
		const q = v * (1 - f * s);
		const t = v * (1 - (1 - f) * s);

		switch (i % 6) {
			case 0: r = v; g = t; b = p; break;
			case 1: r = q; g = v; b = p; break;
			case 2: r = p; g = v; b = t; break;
			case 3: r = p; g = q; b = v; break;
			case 4: r = t; g = p; b = v; break;
			case 5: r = v; g = p; b = q; break;
		}

		return {
			r: Math.round(r * 255),
			g: Math.round(g * 255),
			b: Math.round(b * 255)
		};
	}

	// Конвертация RGB в HEX
	function rgbToHex(r: number, g: number, b: number): string {
		return '#' + [r, g, b].map(x => {
			const hex = x.toString(16);
			return hex.length === 1 ? '0' + hex : hex;
		}).join('').toUpperCase();
	}

	// Обновление цвета
	function updateColor() {
		const rgb = hsvToRgb(hue, saturation, value);
		selectedColor = rgbToHex(rgb.r, rgb.g, rgb.b);
	}

	// Обработка клика/перетаскивания по SV-пикеру
	function handleSVPointerDown(e: PointerEvent) {
		if (disabled || !svPickerElement) return;
		isDraggingSV = true;
		updateSVFromEvent(e);
		svPickerElement.setPointerCapture(e.pointerId);
	}

	function handleSVPointerMove(e: PointerEvent) {
		if (isDraggingSV) {
			updateSVFromEvent(e);
		}
	}

	function handleSVPointerUp(e: PointerEvent) {
		if (isDraggingSV && svPickerElement) {
			isDraggingSV = false;
			svPickerElement.releasePointerCapture(e.pointerId);
		}
	}

	function updateSVFromEvent(e: PointerEvent) {
		if (!svPickerElement) return;
		const rect = svPickerElement.getBoundingClientRect();
		const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
		const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
		
		saturation = (x / rect.width) * 100;
		value = 100 - (y / rect.height) * 100;
		updateColor();
	}

	// Обработка клика/перетаскивания по Hue-слайдеру
	function handleHuePointerDown(e: PointerEvent) {
		if (disabled || !hueSliderElement) return;
		isDraggingHue = true;
		updateHueFromEvent(e);
		hueSliderElement.setPointerCapture(e.pointerId);
	}

	function handleHuePointerMove(e: PointerEvent) {
		if (isDraggingHue) {
			updateHueFromEvent(e);
		}
	}

	function handleHuePointerUp(e: PointerEvent) {
		if (isDraggingHue && hueSliderElement) {
			isDraggingHue = false;
			hueSliderElement.releasePointerCapture(e.pointerId);
		}
	}

	function updateHueFromEvent(e: PointerEvent) {
		if (!hueSliderElement) return;
		const rect = hueSliderElement.getBoundingClientRect();
		const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
		hue = (x / rect.width) * 360;
		updateColor();
	}

	function togglePicker() {
		if (!disabled) {
			isOpen = !isOpen;
			if (isOpen) {
				updateDropdownPosition();
			}
		}
	}

	function applyColor() {
		dispatch('colorChange', { color: selectedColor });
		isOpen = false;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.color-picker')) {
			isOpen = false;
		}
	}

	function closeOnBackdrop() {
		isOpen = false;
	}

	function selectPresetColor(color: string) {
		selectedColor = color;
		dispatch('colorChange', { color });
		isOpen = false;
	}

	onMount(() => {
		checkIfMobile();
		window.addEventListener('resize', checkIfMobile);
		document.addEventListener('click', handleClickOutside);
	});

	onDestroy(() => {
		window.removeEventListener('resize', checkIfMobile);
		document.removeEventListener('click', handleClickOutside);
	});
</script>

<div class="color-picker" class:open={isOpen}>
	<button
		bind:this={pickerButton}
		class="color-picker-trigger btn btn--icon-sm btn--secondary"
		onclick={togglePicker}
		disabled={disabled}
		title={disabled ? "Нет прав на редактирование" : "Выбрать цвет текста"}
	>
		<Palette size={16} class="btn-icon" />
		<div class="color-preview" style="background-color: {selectedColor}"></div>
	</button>

	{#if isOpen}
		<div 
			class="color-picker-dropdown" 
			class:mobile={isMobile}
			style={isMobile ? `top: ${dropdownTop}px; right: ${dropdownRight}px;` : ''}
		>
			{#if isMobile}
				<!-- Упрощенная палитра для мобильных -->
				<div class="preset-colors-grid">
					{#each presetColors as color}
						<button
							class="preset-color-btn"
							class:selected={selectedColor === color}
							style="background-color: {color}"
							onclick={() => selectPresetColor(color)}
							title={color}
						></button>
					{/each}
				</div>
			{:else}
				<!-- Полноценный HSV пикер для десктопа -->
				<!-- SV Picker (Saturation/Value) -->
				<div 
					class="sv-picker" 
					bind:this={svPickerElement}
					style="background-color: hsl({hue}, 100%, 50%)"
					onpointerdown={handleSVPointerDown}
					onpointermove={handleSVPointerMove}
					onpointerup={handleSVPointerUp}
				>
					<div class="sv-overlay-white"></div>
					<div class="sv-overlay-black"></div>
					<div 
						class="sv-cursor" 
						style="left: {saturation}%; top: {100 - value}%"
					></div>
				</div>
				
				<!-- Hue Slider -->
				<div 
					class="hue-slider" 
					bind:this={hueSliderElement}
					onpointerdown={handleHuePointerDown}
					onpointermove={handleHuePointerMove}
					onpointerup={handleHuePointerUp}
				>
					<div 
						class="hue-cursor" 
						style="left: {(hue / 360) * 100}%"
					></div>
				</div>
				
				<!-- Color Preview and Apply -->
				<div class="color-picker-footer">
					<div class="color-preview-large" style="background-color: {selectedColor}"></div>
					<span class="color-hex">{selectedColor}</span>
					<button class="btn btn--primary btn-apply" onclick={applyColor}>
						Применить
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.color-picker {
		position: relative;
		display: inline-block;
	}

	.color-picker-trigger {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.color-preview {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.3);
		pointer-events: none;
	}

	.color-picker-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		z-index: 1000;
		background-color: #2A2A2A;
		border: 1px solid #3A3A3A;
		border-radius: 12px;
		padding: 16px;
		min-width: 260px;
		margin-top: 4px;
	}

	/* Упрощенная версия для мобильных */
	.color-picker-dropdown.mobile {
		position: fixed;
		padding: 12px;
		min-width: 220px;
		left: auto;
		margin-top: 0;
		z-index: 1001;
	}

	/* Палитра предустановленных цветов */
	.preset-colors-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 8px;
	}

	.preset-color-btn {
		width: 36px;
		height: 36px;
		border: 2px solid #3A3A3A;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		padding: 0;
	}

	.preset-color-btn:hover {
		transform: scale(1.05);
		border-color: #505050;
	}

	.preset-color-btn.selected {
		border-color: #646cff;
		outline: 2px solid rgba(100, 108, 255, 0.3);
		outline-offset: 1px;
	}

	/* SV Picker (Saturation/Value) */
	.sv-picker {
		position: relative;
		width: 100%;
		height: 200px;
		border-radius: 8px;
		cursor: crosshair;
		margin-bottom: 12px;
		overflow: hidden;
		touch-action: none;
		user-select: none;
	}

	.sv-overlay-white {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(to right, #FFFFFF, transparent);
	}

	.sv-overlay-black {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(to bottom, transparent, #000000);
	}

	.sv-cursor {
		position: absolute;
		width: 16px;
		height: 16px;
		border: 3px solid #FFFFFF;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	/* Hue Slider */
	.hue-slider {
		position: relative;
		width: 100%;
		height: 16px;
		border-radius: 8px;
		cursor: pointer;
		margin-bottom: 12px;
		background: linear-gradient(to right, 
			#FF0000 0%, 
			#FFFF00 17%, 
			#00FF00 33%, 
			#00FFFF 50%, 
			#0000FF 67%, 
			#FF00FF 83%, 
			#FF0000 100%
		);
		touch-action: none;
		user-select: none;
	}

	.hue-cursor {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 20px;
		height: 20px;
		border: 3px solid #FFFFFF;
		border-radius: 50%;
		pointer-events: none;
	}

	/* Footer */
	.color-picker-footer {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-top: 12px;
		border-top: 1px solid #3A3A3A;
	}

	.color-preview-large {
		width: 40px;
		height: 40px;
		border-radius: 8px;
		border: 2px solid #3A3A3A;
		flex-shrink: 0;
	}

	.color-hex {
		font-size: 13px;
		color: #B0B0B0;
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
		flex: 1;
	}

	.btn-apply {
		font-size: 12px;
		padding: 8px 16px;
		white-space: nowrap;
	}
</style>
