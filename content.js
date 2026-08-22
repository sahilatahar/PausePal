/**
 * PausePal - Content Script
 * Transparent video rendering with configurable size (fullscreen, mid, small),
 * placement (corner/center), play count / loop cycles, and clean white theme modal.
 */

(() => {
	if (window.__pausepal_injected__) return;
	window.__pausepal_injected__ = true;

	const ROOT_ID = "pausepal-overlay-root";
	let activeSession = null;

	// Listen for messages from background worker and popup
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.type === "SHOW_BREAK") {
			showBreakOverlay(message.payload);
			sendResponse({ received: true });
		} else if (message.type === "HIDE_BREAK") {
			hideBreakOverlay();
			sendResponse({ received: true });
		}
	});

	// Check pending break on tab load/visibility
	async function checkPendingBreak() {
		try {
			if (document.visibilityState === "visible") {
				const { pendingBreak } =
					await chrome.storage.local.get("pendingBreak");
				if (pendingBreak) {
					const age = Date.now() - (pendingBreak.triggeredAt || 0);
					if (age < 90000) {
						showBreakOverlay(pendingBreak);
					}
				}
			}
		} catch (e) {}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", checkPendingBreak);
	} else {
		checkPendingBreak();
	}

	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible" && !activeSession) {
			checkPendingBreak();
		}
	});

	/**
	 * Main overlay creation
	 */
	async function showBreakOverlay(payload) {
		if (!payload || !payload.activity) return;

		if (activeSession) {
			cleanupActiveSession();
		}

		const {
			activity,
			activityInfo = {
				title: "Health Break",
				message: "Take a quick moment to refresh.",
				icon: "🐹",
			},
			settings = {},
		} = payload;

		const size = settings.size || "fullscreen";
		const position = settings.position || "bottom-right";
		const targetLoops =
			typeof settings.loopCount === "number" ? settings.loopCount : 2; // 0 = continuous
		const soundEnabled = settings.sound !== false;
		const playbackSpeed = settings.playbackSpeed || 0.75;

		// 1. Play chime if sound enabled
		if (soundEnabled) {
			try {
				const chimeAudio = new Audio(
					chrome.runtime.getURL("sounds/chime.wav"),
				);
				chimeAudio.volume = 0.5;
				chimeAudio.play().catch(() => {});
			} catch (e) {}
		}

		// 2. Root Container
		let root = document.getElementById(ROOT_ID);
		if (!root) {
			root = document.createElement("div");
			root.id = ROOT_ID;
			(document.body || document.documentElement).appendChild(root);
		}
		root.innerHTML = "";

		// 3. Transparent Video Canvas
		const canvas = document.createElement("canvas");
		canvas.id = "pausepal-canvas";
		canvas.className = `pausepal-canvas pausepal-size-${size}`;
		if (size !== "fullscreen") {
			canvas.classList.add(`pausepal-pos-${position}`);
		}

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		if (size === "fullscreen") {
			canvas.width = Math.round(window.innerWidth * dpr);
			canvas.height = Math.round(window.innerHeight * dpr);
			canvas.style.width = "100vw";
			canvas.style.height = "100vh";
			canvas.style.top = "0px";
			canvas.style.left = "0px";
		} else {
			canvas.width = 1280;
			canvas.height = 720;
		}

		// 4. Fixed Corner Action Modal
		const modal = document.createElement("div");
		modal.id = "pausepal-modal";
		modal.className = "pausepal-modal pausepal-anim-enter";

		const header = document.createElement("div");
		header.className = "pausepal-modal-header";

		const titleSpan = document.createElement("span");
		titleSpan.className = "pausepal-modal-title";
		titleSpan.textContent = `${activityInfo.icon || "🐹"} ${activityInfo.title || "Break Time"}`;

		const btnClose = document.createElement("button");
		btnClose.className = "pausepal-btn-close";
		btnClose.id = "pausepal-btn-close";
		btnClose.title = "Dismiss";
		btnClose.textContent = "✕";

		header.appendChild(titleSpan);
		header.appendChild(btnClose);

		const messageP = document.createElement("p");
		messageP.className = "pausepal-modal-text";
		messageP.textContent = activityInfo.message || "";

		const footer = document.createElement("div");
		footer.className = "pausepal-modal-footer";

		const loopBadge = document.createElement("span");
		loopBadge.className = "pausepal-loop-badge";
		loopBadge.id = "pausepal-loop-badge";
		loopBadge.textContent =
			targetLoops > 0 ? `Play 1 of ${targetLoops}` : "Active";

		const btnDone = document.createElement("button");
		btnDone.className = "pausepal-btn-done";
		btnDone.id = "pausepal-btn-done";
		btnDone.textContent = "Done";

		footer.appendChild(loopBadge);
		footer.appendChild(btnDone);

		modal.appendChild(header);
		modal.appendChild(messageP);
		modal.appendChild(footer);

		// 5. Offscreen HTML5 Video
		const video = document.createElement("video");
		video.src = chrome.runtime.getURL(`videos/${activity}.webm`);
		video.muted = true;
		video.defaultMuted = true;
		video.playsInline = true;
		video.autoplay = true;
		video.loop = true;
		video.playbackRate = playbackSpeed;
		video.preload = "auto";
		video.style.display = "none";

		root.appendChild(canvas);
		root.appendChild(video);
		root.appendChild(modal);

		requestAnimationFrame(() => {
			canvas.classList.add("pausepal-canvas-visible");
		});

		const handleResize = () => {
			if (!session.isRunning || size !== "fullscreen") return;
			const currentDpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.round(window.innerWidth * currentDpr);
			canvas.height = Math.round(window.innerHeight * currentDpr);
		};
		window.addEventListener("resize", handleResize);

		// 6. Session Tracking & Loop Counter
		let currentLoop = 1;
		let lastTime = 0;

		const session = {
			root,
			canvas,
			modal,
			video,
			handleResize,
			isRunning: true,
			rafId: null,
			rvfcId: null,
		};
		activeSession = session;

		// Loop cycle tracking via timeupdate
		video.addEventListener("timeupdate", () => {
			if (!session.isRunning) return;
			// Detect wrap around (video looped)
			if (
				lastTime > 0.5 &&
				(video.currentTime < 0.3 || video.currentTime < lastTime - 0.5)
			) {
				currentLoop += 1;
				if (targetLoops > 0) {
					if (currentLoop > targetLoops) {
						dismissBreak();
						return;
					}
					if (loopBadge)
						loopBadge.textContent = `Play ${currentLoop} of ${targetLoops}`;
				}
			}
			lastTime = video.currentTime;
		});

		video.addEventListener("ended", () => {
			if (!session.isRunning) return;
			currentLoop += 1;
			if (targetLoops > 0 && currentLoop > targetLoops) {
				dismissBreak();
			}
		});

		// 7. High-Performance Canvas Drawing Loop
		const ctx = canvas.getContext("2d", { alpha: true });

		function drawFrame() {
			if (!session.isRunning) return;

			if (
				video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
				video.videoWidth > 0
			) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			}

			if ("requestVideoFrameCallback" in video) {
				session.rvfcId = video.requestVideoFrameCallback(drawFrame);
			} else {
				session.rafId = requestAnimationFrame(drawFrame);
			}
		}

		video.addEventListener("canplay", () => {
			if (session.isRunning && video.paused) {
				video.play().catch(() => {});
			}
		});

		try {
			await video.play();
		} catch (e) {}
		drawFrame();

		// 8. Modal Buttons
		if (btnDone) {
			btnDone.addEventListener("click", (e) => {
				e.stopPropagation();
				dismissBreak();
			});
		}

		if (btnClose) {
			btnClose.addEventListener("click", (e) => {
				e.stopPropagation();
				dismissBreak();
			});
		}
	}

	function dismissBreak() {
		chrome.runtime.sendMessage({ type: "DISMISS_BREAK" });
		hideBreakOverlay();
	}

	function hideBreakOverlay() {
		if (!activeSession) return;

		const { modal, canvas } = activeSession;
		if (modal) {
			modal.classList.remove("pausepal-anim-enter");
			modal.classList.add("pausepal-anim-exit");
		}
		if (canvas) {
			canvas.classList.remove("pausepal-canvas-visible");
		}

		setTimeout(() => {
			cleanupActiveSession();
		}, 280);
	}

	function cleanupActiveSession() {
		if (!activeSession) return;

		const { video, rafId, rvfcId, handleResize } = activeSession;
		activeSession.isRunning = false;

		if (handleResize) window.removeEventListener("resize", handleResize);
		if (rafId) cancelAnimationFrame(rafId);
		if (rvfcId && video && "cancelVideoFrameCallback" in video) {
			video.cancelVideoFrameCallback(rvfcId);
		}

		if (video) {
			try {
				video.pause();
				video.src = "";
				video.load();
			} catch (e) {}
		}

		const root = document.getElementById(ROOT_ID);
		if (root) {
			root.remove();
		}

		activeSession = null;
	}
})();
