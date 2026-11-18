import {
	AlertCircle,
	ArrowRight,
	Loader2,
	Lock,
	Mail,
	Radio,
	Sparkles,
	User as UserIcon,
	X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { api } from "../services/api";
import type { User } from "../types";
import { analytics } from "../utils/analytics";
import { sounds } from "../utils/audioSynth";

interface AuthModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: (user: User) => void;
	isSpotifyConfigured: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	isSpotifyConfigured,
}) => {
	const [mode, setMode] = useState<"login" | "register">("register");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		sounds.playClick();
		setIsLoading(true);
		setError(null);

		try {
			if (mode === "register") {
				const res = await api.register({ email, password, displayName });
				analytics.trackAuth("register", res.user.role);
				analytics.setUserId(res.user.id);
				onSuccess(res.user);
				onClose();
			} else if (mode === "login") {
				const res = await api.login({ email, password });
				analytics.trackAuth("login", res.user.role);
				analytics.setUserId(res.user.id);
				onSuccess(res.user);
				onClose();
			}
		} catch (err: any) {
			setError(err.message || "Authentication failed");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSpotifyLogin = () => {
		sounds.playClick();
		window.location.href = "/api/auth/spotify";
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08080B]/85 backdrop-blur-md animate-fade-in select-none">
			<div className="relative w-full max-w-md bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl text-[#F4F4F7] overflow-hidden">
				{/* Close Button */}
				<button
					onClick={() => {
						sounds.playClick();
						onClose();
					}}
					className="absolute top-5 right-5 p-2 rounded-full bg-[#12131A] hover:bg-[#181924] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08] transition-colors"
				>
					<X className="w-4 h-4" />
				</button>

				{/* Modal Header */}
				<div className="text-center mb-6">
					<h3 className="font-headline text-2xl font-bold tracking-tight text-[#F4F4F7]">
						{mode === "login" ? "Account Login" : "Register Account"}
					</h3>
					<p className="text-xs font-body text-[#8E8E9F] mt-1">
						{mode === "login"
							? "Sign in to access your assessment history and sync high scores"
							: "Create an account to benchmark your recognition scores"}
					</p>
				</div>

				{/* Tab switchers */}
				<div className="flex bg-[#12131A] p-1 rounded-full border border-white/[0.08] mb-6 text-xs font-headline font-bold">
					<button
						type="button"
						onClick={() => {
							sounds.playClick();
							setMode("login");
							setError(null);
						}}
						className={`flex-1 py-1.5 rounded-full transition-all ${
							mode === "login"
								? "bg-[#D4FF32] text-[#08080B] shadow-sm"
								: "text-[#8E8E9F] hover:text-[#F4F4F7]"
						} active:scale-[0.97]`}
					>
						Sign In
					</button>
					<button
						type="button"
						onClick={() => {
							sounds.playClick();
							setMode("register");
							setError(null);
						}}
						className={`flex-1 py-1.5 rounded-full transition-all ${
							mode === "register"
								? "bg-[#D4FF32] text-[#08080B] shadow-sm"
								: "text-[#8E8E9F] hover:text-[#F4F4F7]"
						} active:scale-[0.97]`}
					>
						Register
					</button>
				</div>

				{/* Error notification */}
				{error && (
					<div className="mb-4 p-3 rounded-xl bg-[#FF4694]/10 border border-[#FF4694]/30 text-xs text-[#FF4694] flex items-center gap-2">
						<AlertCircle className="w-4 h-4 text-[#FF4694] shrink-0" />
						<span>{error}</span>
					</div>
				)}

				{/* Spotify OAuth Quick Button */}
				{isSpotifyConfigured && (
					<div className="mb-5">
						<button
							type="button"
							onClick={handleSpotifyLogin}
							className="w-full py-2.5 px-4 rounded-full font-headline font-bold text-xs sm:text-sm bg-[#1DB954] hover:bg-[#1ed760] text-black shadow-md flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
						>
							<svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
								<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.31c-.22.358-.691.474-1.049.255-2.884-1.764-6.514-2.162-10.793-1.185-.407.094-.814-.16-.908-.567-.094-.407.16-.814.567-.908 4.685-1.07 8.706-.615 11.928 1.356.358.22.474.691.255 1.049zm1.467-3.26c-.276.449-.867.594-1.316.318-3.303-2.03-8.337-2.617-12.244-1.431-.504.153-1.036-.134-1.189-.638-.153-.504.134-1.036.638-1.189 4.462-1.354 10.021-.697 13.793 1.624.449.276.594.867.318 1.316zm.126-3.398C15.137 8.36 8.618 8.136 4.845 9.282c-.611.186-1.26-.167-1.446-.778-.186-.611.167-1.26.778-1.446 4.333-1.315 11.536-1.056 16.035 1.615.549.326.731 1.041.405 1.59-.326.549-1.041.731-1.59.405z" />
							</svg>
							<span>Continue with Spotify</span>
						</button>

						<div className="relative flex items-center justify-center my-4">
							<div className="border-t border-white/[0.08] w-full" />
							<span className="bg-[#0D0D11] px-3 font-mono text-[10px] uppercase text-[#8E8E9F]">
								OR
							</span>

							<div className="border-t border-white/[0.08] w-full" />
						</div>
					</div>
				)}

				{/* Email Form */}
				<form onSubmit={handleSubmit} className="space-y-3.5">
					{mode === "register" && (
						<div>
							<label className="block text-xs font-headline font-semibold text-[#8E8E9F] mb-1">
								Display Name
							</label>
							<div className="relative flex items-center">
								<UserIcon className="w-4 h-4 text-[#8E8E9F] absolute left-3.5" />
								<input
									type="text"
									required
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									placeholder="e.g. SonicRider"
									className="w-full pl-10 pr-4 py-2 rounded-full bg-[#12131A] border border-white/[0.08] text-[#F4F4F7] placeholder-[#8E8E9F] text-xs sm:text-sm focus:outline-none focus:border-[#D4FF32]"
								/>
							</div>
						</div>
					)}

					<div>
						<label className="block text-xs font-headline font-semibold text-[#8E8E9F] mb-1">
							Email Address
						</label>
						<div className="relative flex items-center">
							<Mail className="w-4 h-4 text-[#8E8E9F] absolute left-3.5" />
							<input
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								className="w-full pl-10 pr-4 py-2 rounded-full bg-[#12131A] border border-white/[0.08] text-[#F4F4F7] placeholder-[#8E8E9F] text-xs sm:text-sm focus:outline-none focus:border-[#D4FF32]"
							/>
						</div>
					</div>

					<div>
						<label className="block text-xs font-headline font-semibold text-[#8E8E9F] mb-1">
							Password
						</label>
						<div className="relative flex items-center">
							<Lock className="w-4 h-4 text-[#8E8E9F] absolute left-3.5" />
							<input
								type="password"
								required
								minLength={6}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								className="w-full pl-10 pr-4 py-2 rounded-full bg-[#12131A] border border-white/[0.08] text-[#F4F4F7] placeholder-[#8E8E9F] text-xs sm:text-sm focus:outline-none focus:border-[#D4FF32]"
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="w-full mt-2 py-2.5 px-6 rounded-full font-headline font-bold text-xs sm:text-sm bg-[#D4FF32] text-[#08080B] hover:bg-[#c2eb2c] shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
					>
						{isLoading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<>
								<span>{mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}</span>
								<ArrowRight className="w-4 h-4" />
							</>
						)}
					</button>
				</form>
			</div>
		</div>
	);
};
