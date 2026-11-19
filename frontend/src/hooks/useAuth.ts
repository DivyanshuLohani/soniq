import { useState } from "react";
import type { User } from "../types";
import { api } from "../services/api";
import { analytics } from "../utils/analytics";

export function useAuth() {
	const [user, setUser] = useState<User | null>(null);
	const [isSpotifyConfigured, setIsSpotifyConfigured] = useState(false);
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
	const [authError, setAuthError] = useState<string | null>(null);

	const initAuth = async () => {
		const params = new URLSearchParams(window.location.search);
		const token = params.get("token");
		const error = params.get("error");

		if (token) {
			localStorage.setItem("auth_token", token);
			window.history.replaceState({}, document.title, window.location.pathname);
		}

		if (error) {
			setAuthError(`Spotify Login notice: ${decodeURIComponent(error)}`);
			window.history.replaceState({}, document.title, window.location.pathname);
		}

		// 1. Check auth status & Spotify config
		try {
			const status = await api.getAuthStatus();
			setIsSpotifyConfigured(status.spotifyConfigured);
		} catch (e) {
			console.warn("Could not check auth status", e);
		}

		// 2. Fetch logged in user
		try {
			const currentUser = await api.getCurrentUser();
			if (currentUser) {
				setUser(currentUser);
				analytics.setUserId(currentUser.id);
			} else {
				setUser(null);
				analytics.setUserId(null);
			}
		} catch (e) {
			console.warn("Could not init user session", e);
		}
	};

	const logout = async () => {
		await api.logout();
		setUser(null);
		localStorage.removeItem("auth_token");
		analytics.setUserId(null);
	};

	return {
		user,
		setUser,
		isSpotifyConfigured,
		isAuthModalOpen,
		setIsAuthModalOpen,
		isSpotifyModalOpen,
		setIsSpotifyModalOpen,
		authError,
		setAuthError,
		initAuth,
		logout,
	};
}
