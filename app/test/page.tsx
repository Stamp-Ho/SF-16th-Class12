'use client'

import { FormEvent, useState } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'

type LoginResponse = {
	accessToken: string
	tokenType: string
	accessTokenExpiresIn: number
	refreshTokenExpiresIn: number
	user: {
		id: number
		username: string
		role: string
		status: string
	}
}

export default function TestPage() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [result, setResult] = useState<LoginResponse | null>(null)
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setIsLoading(true)
		setResult(null)
		setError(null)

		try {
			const response = await fetch(`${API_BASE_URL}/api/users/login`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password }),
			})
			const body = await response.text()
			const data = body ? JSON.parse(body) : null

			if (!response.ok) {
				throw new Error(data?.message ?? body ?? `HTTP ${response.status}`)
			}

			setResult(data as LoginResponse)
		} catch (caughtError) {
			setError(caughtError instanceof Error ? caughtError.message : '로그인 요청에 실패했습니다.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<main style={{ maxWidth: 480, margin: '80px auto', padding: 24 }}>
			<h1>로그인 API 테스트</h1>
			<p>요청 주소: {API_BASE_URL}/api/users/login</p>

			<form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
				<label>
					Username
					<input
						required
						value={username}
						onChange={(event) => setUsername(event.target.value)}
						style={{ display: 'block', width: '100%', marginTop: 6, padding: 8 }}
					/>
				</label>
				<label>
					Password
					<input
						required
						type="password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						style={{ display: 'block', width: '100%', marginTop: 6, padding: 8 }}
					/>
				</label>
				<button type="submit" disabled={isLoading}>
					{isLoading ? '로그인 중...' : '로그인 요청'}
				</button>
			</form>

			{error && <p role="alert" style={{ color: 'crimson' }}>실패: {error}</p>}
			{result && (
				<pre style={{ marginTop: 24, overflowX: 'auto', padding: 16, background: '#f4f4f5' }}>
					{JSON.stringify(result, null, 2)}
				</pre>
			)}
		</main>
	)
}
