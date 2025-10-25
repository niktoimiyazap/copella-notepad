<script lang="ts">
	import type { UserRole } from '$lib/types/user';

	interface Props {
		searchQuery: string;
		selectedRole: string;
		selectedActivity: string;
		onSearchChange: (query: string) => void;
		onRoleFilterChange: (role: string) => void;
		onActivityFilterChange: (activity: string) => void;
		onClearFilters: () => void;
	}

	let { 
		searchQuery, 
		selectedRole, 
		selectedActivity, 
		onSearchChange, 
		onRoleFilterChange, 
		onActivityFilterChange, 
		onClearFilters 
	}: Props = $props();

	const roleOptions = [
		{ value: '', label: 'Все роли' },
		{ value: 'admin', label: 'Владельцы' },
		{ value: 'moderator', label: 'Модераторы' },
		{ value: 'user', label: 'Пользователи' }
	];

	const activityOptions = [
		{ value: '', label: 'Вся активность' },
		{ value: 'online', label: 'Онлайн' },
		{ value: 'recent', label: 'Недавно активные' },
		{ value: 'inactive', label: 'Неактивные' }
	];

	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		onSearchChange(target.value);
	}

	function handleRoleSelect(event: Event) {
		const target = event.target as HTMLSelectElement;
		onRoleFilterChange(target.value);
	}

	function handleActivitySelect(event: Event) {
		const target = event.target as HTMLSelectElement;
		onActivityFilterChange(target.value);
	}

	function hasActiveFilters(): boolean {
		return searchQuery.length > 0 || selectedRole !== '' || selectedActivity !== '';
	}
</script>

<div class="filters-container">
	<div class="search-section">
		<div class="search-input-wrapper">
			<svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			<input
				type="text"
				placeholder="Поиск по имени или email..."
				value={searchQuery}
				oninput={handleSearchInput}
				class="search-input"
			/>
			{#if searchQuery.length > 0}
				<button 
					class="clear-search-btn"
					onclick={() => onSearchChange('')}
					title="Очистить поиск"
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<div class="filters-section">
		<div class="filter-group">
			<label class="filter-label">Роль:</label>
			<select 
				value={selectedRole} 
				onchange={handleRoleSelect}
				class="filter-select"
			>
				{#each roleOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>

		<div class="filter-group">
			<label class="filter-label">Активность:</label>
			<select 
				value={selectedActivity} 
				onchange={handleActivitySelect}
				class="filter-select"
			>
				{#each activityOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>

		{#if hasActiveFilters()}
			<button 
				class="clear-filters-btn"
				onclick={onClearFilters}
				title="Очистить все фильтры"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				Очистить
			</button>
		{/if}
	</div>
</div>

<style>
	.filters-container {
		background: #ffffff;
		border: 1px solid #dadce0;
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 16px;
		box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
	}

	.search-section {
		margin-bottom: 16px;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 12px;
		color: #5f6368;
		z-index: 1;
	}

	.search-input {
		width: 100%;
		padding: 10px 12px 10px 40px;
		border: 1px solid #dadce0;
		border-radius: 6px;
		font-size: 14px;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #ffffff;
		color: #202124;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: #1a73e8;
		box-shadow: 0 0 0 1px rgba(26, 115, 232, 0.2);
	}

	.search-input::placeholder {
		color: #9aa0a6;
	}

	.clear-search-btn {
		position: absolute;
		right: 8px;
		background: none;
		border: none;
		color: #5f6368;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s ease;
	}

	.clear-search-btn:hover {
		background: #f1f3f4;
		color: #202124;
	}

	.filters-section {
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.filter-label {
		font-size: 13px;
		font-weight: 500;
		color: #5f6368;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		white-space: nowrap;
	}

	.filter-select {
		padding: 6px 12px;
		border: 1px solid #dadce0;
		border-radius: 4px;
		background: #ffffff;
		font-size: 13px;
		color: #202124;
		cursor: pointer;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		transition: border-color 0.2s ease;
		min-width: 120px;
	}

	.filter-select:focus {
		outline: none;
		border-color: #1a73e8;
		box-shadow: 0 0 0 1px rgba(26, 115, 232, 0.2);
	}

	.filter-select:hover {
		border-color: #1a73e8;
	}

	.clear-filters-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		background: #f8f9fa;
		border: 1px solid #dadce0;
		border-radius: 4px;
		color: #5f6368;
		font-size: 13px;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-left: auto;
	}

	.clear-filters-btn:hover {
		background: #e8f0fe;
		border-color: #1a73e8;
		color: #1a73e8;
	}

	/* Адаптивность */
	@media (max-width: 768px) {
		.filters-section {
			flex-direction: column;
			align-items: stretch;
			gap: 12px;
		}

		.filter-group {
			justify-content: space-between;
		}

		.clear-filters-btn {
			margin-left: 0;
			justify-content: center;
		}
	}
</style>
