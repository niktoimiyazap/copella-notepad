<script lang="ts">
	import { register, checkUsernameAvailability, checkEmailAvailability } from '$lib/api/userApi';
	import { currentUser } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import RegisterStep1A from '$lib/components/forms/RegisterStep1A.svelte';
	import RegisterStep1B from '$lib/components/forms/RegisterStep1B.svelte';
	import RegisterStep2 from '$lib/components/forms/RegisterStep2.svelte';
	import UsernameSelection from '$lib/components/forms/UsernameSelection.svelte';

	let currentStep = $state(1);
	let step1AData = $state<{ fullName: string; email: string } | null>(null);
	let step1BData = $state<{ password: string } | null>(null);
	let step2Data = $state<{ code: string } | null>(null);
	let step3Data = $state<{ username: string; avatarUrl: string | null } | null>(null);
	let isLoading = $state(false);
	let error = $state('');

	// Ссылки на компоненты для вызова их методов
	let step1AComponent: RegisterStep1A;
	let step1BComponent: RegisterStep1B;
	let step2Component: RegisterStep2;
	let step3Component: UsernameSelection;

	// Обработка якорных ссылок
	onMount(() => {
		const hash = window.location.hash;
		if (hash === '#register-form') {
			setTimeout(() => {
				const element = document.getElementById('register-form');
				if (element) {
					element.scrollIntoView({ behavior: 'smooth' });
				}
			}, 100);
		}
	});

	async function handleStep1ANext(event: CustomEvent<{ fullName: string; email: string }>) {
		const { fullName, email } = event.detail;
		step1AData = { fullName, email };
		
		isLoading = true;
		error = '';

		try {
			// Проверяем доступность email
			const { available: emailAvailable, error: emailError } = await checkEmailAvailability(email);
			if (emailError || !emailAvailable) {
				error = emailError || 'Этот email уже зарегистрирован';
				step1AComponent?.setError(error);
				isLoading = false;
				return;
			}

			// Переходим к следующему шагу
			currentStep = 1.5;
			step1BComponent?.setLoading(false);
		} catch (err) {
			error = 'Произошла ошибка при проверке email';
			step1AComponent?.setError(error);
			isLoading = false;
		}
	}

	async function handleStep1BNext(event: CustomEvent<{ password: string }>) {
		const { password } = event.detail;
		step1BData = { password };
		
		isLoading = true;
		error = '';

		try {
			// Отправляем код подтверждения
			const { error: signUpError } = await supabase.auth.signUp({
				email: step1AData!.email,
				password,
				options: {
					data: {
						full_name: step1AData!.fullName
					}
				}
			});

			if (signUpError) {
				error = signUpError.message;
				step1BComponent?.setError(error);
				isLoading = false;
				return;
			}

			// Переходим к следующему шагу
			currentStep = 2;
			step2Component?.setLoading(false);
		} catch (err) {
			error = 'Произошла ошибка при отправке кода подтверждения';
			step1BComponent?.setError(error);
			isLoading = false;
		}
	}

	function handleStep1BBack() {
		currentStep = 1;
		step1AData = null;
		step1BData = null;
	}

	async function handleStep2Next(event: CustomEvent<{ code: string }>) {
		const { code } = event.detail;
		step2Data = { code };
		
		isLoading = true;
		error = '';

		try {
			// Подтверждаем код
			const { data, error: verifyError } = await supabase.auth.verifyOtp({
				email: step1AData!.email,
				token: code,
				type: 'email'
			});

			if (verifyError) {
				error = verifyError.message;
				step2Component?.setError(error);
				step2Component?.clearCode();
				isLoading = false;
				return;
			}

			// Переходим к следующему шагу
			currentStep = 3;
			step3Component?.setLoading(false);
		} catch (err) {
			error = 'Неверный код подтверждения';
			step2Component?.setError(error);
			step2Component?.clearCode();
			isLoading = false;
		}
	}

	async function handleStep2Resend() {
		if (!step1AData) return;
		
		isLoading = true;
		error = '';

		try {
			const { error: resendError } = await supabase.auth.resend({
				type: 'signup',
				email: step1AData.email
			});

			if (resendError) {
				error = resendError.message;
				step2Component?.setError(error);
			}
		} catch (err) {
			error = 'Ошибка при повторной отправке кода';
			step2Component?.setError(error);
		} finally {
			isLoading = false;
		}
	}

	function handleStep2Back() {
		currentStep = 1.5;
		step1BData = null;
		step2Data = null;
	}

	async function handleStep3Complete(event: CustomEvent<{ username: string; avatarUrl: string | null }>) {
		const { username, avatarUrl } = event.detail;
		step3Data = { username, avatarUrl };
		
		isLoading = true;
		error = '';

		try {
			// Проверяем доступность username
			const { available: usernameAvailable, error: usernameError } = await checkUsernameAvailability(username);
			if (usernameError || !usernameAvailable) {
				error = usernameError || 'Этот никнейм уже занят';
				step3Component?.setError(error);
				isLoading = false;
				return;
			}

			// Получаем текущего пользователя из Supabase Auth
			const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
			
			if (authError || !authUser) {
				error = 'Ошибка получения данных пользователя';
				step3Component?.setError(error);
				isLoading = false;
				return;
			}

			// Создаем профиль пользователя в локальной БД
			const response = await fetch('/api/auth/create-profile', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					user_id: authUser.id,
					email: step1AData!.email,
					full_name: step1AData!.fullName,
					username,
					avatar_url: avatarUrl
				})
			});

			const result = await response.json();
			
			if (!response.ok) {
				error = result.error || 'Ошибка создания профиля';
				step3Component?.setError(error);
				isLoading = false;
				return;
			}

			const user = result.user;

			if (user) {
				// Обновляем централизованный store с данными пользователя
				const { userActions } = await import('$lib/stores/user');
				userActions.setUser({
					id: user.id,
					email: user.email,
					fullName: user.fullName || user.full_name,
					username: user.username,
					avatarUrl: user.avatarUrl || user.avatar_url
				});
				
				// Ждем немного, чтобы сессия успела установиться
				await new Promise(resolve => setTimeout(resolve, 500));
				
				// Перенаправляем на главную страницу
				goto('/');
			}
		} catch (err) {
			error = 'Произошла ошибка при создании профиля';
			step3Component?.setError(error);
			isLoading = false;
		}
	}
</script>

<div class="auth-page">
	<!-- Background grid -->
	<div class="background-grid"></div>
	
	<!-- Main content centered -->
	<div class="auth-layout">
		<div class="form-section">
			<div id="register-form" class="form-container">
				<div class="brand-section">
					<img src="/logo/cnotepad-full.png" alt="Copella Notepad" class="brand-logo" />
				</div>

				<!-- Step 1A: Name & Email -->
				{#if currentStep === 1}
					<RegisterStep1A
						bind:this={step1AComponent}
						on:next={handleStep1ANext}
					/>
				{/if}

				<!-- Step 1B: Password -->
				{#if currentStep === 1.5}
					<RegisterStep1B
						bind:this={step1BComponent}
						on:next={handleStep1BNext}
						on:back={handleStep1BBack}
					/>
				{/if}

				<!-- Step 2: Email Confirmation -->
				{#if currentStep === 2}
					<RegisterStep2
						bind:this={step2Component}
						email={step1AData?.email || ''}
						on:next={handleStep2Next}
						on:resend={handleStep2Resend}
						on:back={handleStep2Back}
					/>
				{/if}

				<!-- Step 3: Username -->
				{#if currentStep === 3}
					<UsernameSelection
						bind:this={step3Component}
						on:complete={handleStep3Complete}
					/>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.auth-page {
		min-height: 100vh;
		background: #121212;
		position: relative;
		overflow: hidden;
		scroll-behavior: smooth;
	}

	.background-grid {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: 
			linear-gradient(rgba(254, 177, 255, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(254, 177, 255, 0.03) 1px, transparent 1px);
		background-size: 50px 50px;
		opacity: 0.5;
	}

	.auth-layout {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		position: relative;
		z-index: 1;
	}

	.form-section {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px;
		background: #121212;
		width: 100%;
	}

	.form-container {
		width: 100%;
		max-width: 500px;
	}

	.brand-section {
		text-align: center;
		margin-bottom: 40px;
	}

	.brand-logo {
		height: 40px;
		margin-bottom: 20px;
	}

	@media (max-width: 1024px) {
		.form-section {
			padding: 20px;
		}
	}

	@media (max-width: 480px) {
		.form-section {
			padding: 16px;
		}
	}
</style>
