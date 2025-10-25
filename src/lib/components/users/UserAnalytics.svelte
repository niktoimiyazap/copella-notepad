<script lang="ts">
	import type { User } from '$lib/types/user';

	interface Props {
		users: User[];
	}

	let { users }: Props = $props();

	// Вычисляемые значения для статистики
	let totalUsers = $derived(users.length);
	let adminCount = $derived(users.filter(u => u.role === 'admin').length);
	let moderatorCount = $derived(users.filter(u => u.role === 'moderator').length);
	let userCount = $derived(users.filter(u => u.role === 'user').length);

	// Активность пользователей
	let onlineUsers = $derived(users.filter(u => {
		const now = new Date();
		const lastActive = new Date(u.lastActive);
		const diffInMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);
		return diffInMinutes <= 5; // Считаем онлайн если активен в последние 5 минут
	}).length);

	let recentUsers = $derived(users.filter(u => {
		const now = new Date();
		const lastActive = new Date(u.lastActive);
		const diffInHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
		return diffInHours <= 24; // Активен в последние 24 часа
	}).length);

	let inactiveUsers = $derived(users.filter(u => {
		const now = new Date();
		const lastActive = new Date(u.lastActive);
		const diffInDays = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
		return diffInDays > 7; // Неактивен более 7 дней
	}).length);

	// Топ активных пользователей
	let topActiveUsers = $derived(
		[...users]
			.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
			.slice(0, 5)
	);

	// Статистика по ролям для графика
	let roleStats = $derived([
		{ role: 'Владельцы', count: adminCount, percentage: totalUsers > 0 ? Math.round((adminCount / totalUsers) * 100) : 0, color: '#d93025' },
		{ role: 'Модераторы', count: moderatorCount, percentage: totalUsers > 0 ? Math.round((moderatorCount / totalUsers) * 100) : 0, color: '#f9ab00' },
		{ role: 'Пользователи', count: userCount, percentage: totalUsers > 0 ? Math.round((userCount / totalUsers) * 100) : 0, color: '#1a73e8' }
	]);

	function formatLastActive(date: Date): string {
		const now = new Date();
		const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
		
		if (diffInHours < 1) {
			return 'Сейчас';
		} else if (diffInHours < 24) {
			return `${diffInHours}ч назад`;
		} else {
			const diffInDays = Math.floor(diffInHours / 24);
			return `${diffInDays}д назад`;
		}
	}

	function getRoleColor(role: string): string {
		switch (role) {
			case 'admin': return '#d93025';
			case 'moderator': return '#f9ab00';
			default: return '#1a73e8';
		}
	}

	function getRoleLabel(role: string): string {
		switch (role) {
			case 'admin': return 'Владелец';
			case 'moderator': return 'Модератор';
			default: return 'Пользователь';
		}
	}
</script>

<div class="analytics-container">
	<div class="analytics-header">
		<h2>Статистика пользователей</h2>
	</div>

	<div class="analytics-grid">
		<!-- Общая статистика -->
		<div class="stats-card">
			<div class="stats-header">
				<h3>Общая статистика</h3>
			</div>
			<div class="stats-content">
				<div class="stat-item">
					<div class="stat-value">{totalUsers}</div>
					<div class="stat-label">Всего пользователей</div>
				</div>
				<div class="stat-item">
					<div class="stat-value online">{onlineUsers}</div>
					<div class="stat-label">Онлайн</div>
				</div>
				<div class="stat-item">
					<div class="stat-value recent">{recentUsers}</div>
					<div class="stat-label">Активны сегодня</div>
				</div>
				<div class="stat-item">
					<div class="stat-value inactive">{inactiveUsers}</div>
					<div class="stat-label">Неактивны</div>
				</div>
			</div>
		</div>

		<!-- Статистика по ролям -->
		<div class="stats-card">
			<div class="stats-header">
				<h3>Распределение по ролям</h3>
			</div>
			<div class="stats-content">
				{#each roleStats as stat}
					<div class="role-stat-item">
						<div class="role-info">
							<div class="role-color" style="background-color: {stat.color}"></div>
							<span class="role-name">{stat.role}</span>
						</div>
						<div class="role-numbers">
							<span class="role-count">{stat.count}</span>
							<span class="role-percentage">({stat.percentage}%)</span>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Топ активных пользователей -->
		<div class="stats-card">
			<div class="stats-header">
				<h3>Топ активных пользователей</h3>
			</div>
			<div class="stats-content">
				{#each topActiveUsers as user, index}
					<div class="top-user-item">
						<div class="user-rank">#{index + 1}</div>
						<div class="user-info">
							<div class="user-name">{user.username || user.name}</div>
							<div class="user-role" style="color: {getRoleColor(user.role)}">
								{getRoleLabel(user.role)}
							</div>
						</div>
						<div class="user-activity">
							{formatLastActive(user.lastActive)}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- График активности -->
		<div class="stats-card chart-card">
			<div class="stats-header">
				<h3>Активность пользователей</h3>
			</div>
			<div class="chart-container">
				<div class="activity-chart">
					{#each roleStats as stat}
						<div class="chart-bar">
							<div class="bar-fill" style="height: {stat.percentage}%; background-color: {stat.color}"></div>
							<div class="bar-label">{stat.role}</div>
							<div class="bar-value">{stat.count}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.analytics-container {
		background: #ffffff;
		border: 1px solid #dadce0;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
		margin-bottom: 16px;
	}

	.analytics-header {
		background: #f8f9fa;
		padding: 16px 20px;
		border-bottom: 1px solid #dadce0;
	}

	.analytics-header h2 {
		font-size: 18px;
		font-weight: 500;
		color: #202124;
		margin: 0;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.analytics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 0;
	}

	.stats-card {
		border-right: 1px solid #dadce0;
		border-bottom: 1px solid #dadce0;
	}

	.stats-card:last-child {
		border-right: none;
	}

	.stats-card:nth-last-child(-n+2) {
		border-bottom: none;
	}

	.stats-header {
		padding: 16px 20px 12px;
		border-bottom: 1px solid #e8eaed;
	}

	.stats-header h3 {
		font-size: 14px;
		font-weight: 500;
		color: #5f6368;
		margin: 0;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.stats-content {
		padding: 16px 20px;
	}

	/* Общая статистика */
	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
	}

	.stat-item:not(:last-child) {
		border-bottom: 1px solid #f1f3f4;
	}

	.stat-value {
		font-size: 20px;
		font-weight: 600;
		color: #202124;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.stat-value.online {
		color: #137333;
	}

	.stat-value.recent {
		color: #1a73e8;
	}

	.stat-value.inactive {
		color: #d93025;
	}

	.stat-label {
		font-size: 13px;
		color: #5f6368;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	/* Статистика по ролям */
	.role-stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
	}

	.role-stat-item:not(:last-child) {
		border-bottom: 1px solid #f1f3f4;
	}

	.role-info {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.role-color {
		width: 12px;
		height: 12px;
		border-radius: 50%;
	}

	.role-name {
		font-size: 13px;
		color: #202124;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.role-numbers {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.role-count {
		font-size: 14px;
		font-weight: 500;
		color: #202124;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.role-percentage {
		font-size: 12px;
		color: #5f6368;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	/* Топ пользователей */
	.top-user-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 0;
	}

	.top-user-item:not(:last-child) {
		border-bottom: 1px solid #f1f3f4;
	}

	.user-rank {
		font-size: 12px;
		font-weight: 600;
		color: #5f6368;
		background: #f1f3f4;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.user-info {
		flex: 1;
		min-width: 0;
	}

	.user-name {
		font-size: 13px;
		font-weight: 500;
		color: #202124;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.user-role {
		font-size: 11px;
		font-weight: 400;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.user-activity {
		font-size: 11px;
		color: #5f6368;
		white-space: nowrap;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	/* График */
	.chart-card {
		grid-column: 1 / -1;
	}

	.chart-container {
		padding: 20px;
	}

	.activity-chart {
		display: flex;
		align-items: end;
		justify-content: space-around;
		height: 120px;
		gap: 16px;
	}

	.chart-bar {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
		max-width: 80px;
	}

	.bar-fill {
		width: 100%;
		border-radius: 4px 4px 0 0;
		min-height: 4px;
		transition: height 0.3s ease;
	}

	.bar-label {
		font-size: 11px;
		color: #5f6368;
		margin-top: 8px;
		text-align: center;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.bar-value {
		font-size: 12px;
		font-weight: 500;
		color: #202124;
		margin-top: 4px;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	/* Адаптивность */
	@media (max-width: 768px) {
		.analytics-grid {
			grid-template-columns: 1fr;
		}

		.stats-card {
			border-right: none;
			border-bottom: 1px solid #dadce0;
		}

		.stats-card:last-child {
			border-bottom: none;
		}

		.activity-chart {
			height: 100px;
			gap: 8px;
		}

		.chart-bar {
			max-width: 60px;
		}
	}
</style>
