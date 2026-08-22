/**
 * PausePal - Background Service Worker (Manifest V3)
 * Multi-reminder scheduling, auto-cleanup of expired reminders,
 * settings synchronization, and dynamic tab injection.
 */

const ACTIVITY_INFO = {
	"pausepal-breathe": {
		title: "Breathe & Reset",
		message: "Take 3 deep, slow breaths. Inhale calm, exhale tension.",
		icon: "🧘",
	},
	"pausepal-drink-water": {
		title: "Drink Water",
		message: "Grab a glass of water to stay hydrated and refreshed.",
		icon: "💧",
	},
	"pausepal-eye-break": {
		title: "20-20-20 Eye Rest",
		message: "Look 20 feet away for 20 seconds to ease eye strain.",
		icon: "👀",
	},
	"pausepal-posture": {
		title: "Posture Check",
		message:
			"Straighten your back, roll shoulders back, and relax your neck.",
		icon: "🪑",
	},
	"pausepal-stretch": {
		title: "Stretch & Move",
		message:
			"Stand up, stretch your arms overhead, and shake out your wrists.",
		icon: "🤸",
	},
};

const DEFAULT_SETTINGS = {
	size: "fullscreen", // 'fullscreen' | 'mid' | 'small'
	position: "bottom-right", // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'
	loopCount: 2, // 1, 2, 3, 5, 0 (continuous)
	sound: true,
	playbackSpeed: 0.75,
};

// Default initial reminder on installation
const DEFAULT_REMINDERS = [
	{
		id: "rem_default_1",
		type: "pausepal-breathe",
		mode: "recurring",
		minutes: 30,
		nextTriggerAt: Date.now() + 30 * 60 * 1000,
		createdAt: Date.now(),
	},
];

// Initialize on install or extension update
chrome.runtime.onInstalled.addListener(async () => {
	const data = await chrome.storage.local.get(["settings", "reminders"]);
	const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
	let reminders = data.reminders || DEFAULT_REMINDERS;

	// Clean any past expired one-time reminders on start
	const now = Date.now();
	reminders = reminders.filter(
		(r) => r.mode === "recurring" || r.nextTriggerAt > now,
	);

	await chrome.storage.local.set({ settings, reminders, pendingBreak: null });
	await syncAlarms(reminders);
});

// Synchronize Chrome Alarms with active reminders list
async function syncAlarms(reminders) {
	const allAlarms = await chrome.alarms.getAll();
	for (const alarm of allAlarms) {
		if (alarm.name.startsWith("reminder_")) {
			await chrome.alarms.clear(alarm.name);
		}
	}

	const now = Date.now();
	for (const r of reminders) {
		const alarmName = "reminder_" + r.id;
		let delayMinutes = Math.max(0.1, (r.nextTriggerAt - now) / 60000);

		if (r.mode === "recurring") {
			chrome.alarms.create(alarmName, {
				delayInMinutes: delayMinutes,
				periodInMinutes: r.minutes,
			});
		} else {
			chrome.alarms.create(alarmName, {
				delayInMinutes: delayMinutes,
			});
		}
	}
}

// Alarm listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
	if (alarm.name.startsWith("reminder_")) {
		const reminderId = alarm.name.replace("reminder_", "");
		const data = await chrome.storage.local.get(["reminders", "settings"]);
		let reminders = data.reminders || [];
		const settings = data.settings || DEFAULT_SETTINGS;

		const index = reminders.findIndex((r) => r.id === reminderId);
		if (index !== -1) {
			const reminder = reminders[index];

			// Trigger the break on the active tab
			await triggerBreak(reminder.type, settings);

			if (reminder.mode === "once") {
				// Auto-remove expired one-time reminder
				reminders.splice(index, 1);
				await chrome.alarms.clear(alarm.name);
			} else {
				// Update next trigger time for recurring reminder
				reminder.nextTriggerAt =
					Date.now() + reminder.minutes * 60 * 1000;
			}

			await chrome.storage.local.set({ reminders });
		}
	}
});

function isValidTab(url) {
	if (!url) return true;
	return (
		!url.startsWith("chrome://") &&
		!url.startsWith("chrome-extension://") &&
		!url.startsWith("moz-extension://") &&
		!url.startsWith("resource://") &&
		!url.startsWith("edge://") &&
		!url.startsWith("about:") &&
		!url.startsWith("view-source:")
	);
}

/**
 * Sends break payload to active tab or dynamically injects content script
 */
async function sendOrInjectBreak(tabId, breakPayload) {
	try {
		await chrome.tabs.sendMessage(tabId, {
			type: "SHOW_BREAK",
			payload: breakPayload,
		});
		return true;
	} catch (err) {
		try {
			await chrome.scripting.insertCSS({
				target: { tabId },
				files: ["content.css"],
			});
			await chrome.scripting.executeScript({
				target: { tabId },
				files: ["content.js"],
			});

			await new Promise((resolve) => setTimeout(resolve, 80));
			await chrome.tabs.sendMessage(tabId, {
				type: "SHOW_BREAK",
				payload: breakPayload,
			});
			return true;
		} catch (injectErr) {
			console.warn("Cannot inject into tab:", injectErr);
			return false;
		}
	}
}

async function triggerBreak(
	activityKey,
	customSettings = null,
	targetTabId = null,
) {
	const data = await chrome.storage.local.get("settings");
	const settings = customSettings || data.settings || DEFAULT_SETTINGS;

	const activity = activityKey || "pausepal-breathe";
	const activityInfo = ACTIVITY_INFO[activity] || {
		title: "Break Time",
		message: "Time for a healthy break with PausePal.",
		icon: "🐹",
	};

	const breakPayload = {
		activity,
		activityInfo,
		settings,
		triggeredAt: Date.now(),
	};

	await chrome.storage.local.set({ pendingBreak: breakPayload });

	if (targetTabId) {
		try {
			const targetTab = await chrome.tabs.get(targetTabId);
			if (targetTab && isValidTab(targetTab.url)) {
				return await sendOrInjectBreak(targetTab.id, breakPayload);
			}
		} catch (e) {}
	}

	const tabs = await chrome.tabs.query({
		active: true,
		lastFocusedWindow: true,
	});
	if (tabs && tabs[0] && tabs[0].id) {
		const tab = tabs[0];
		if (isValidTab(tab.url)) {
			return await sendOrInjectBreak(tab.id, breakPayload);
		}
	}
	return false;
}

// When user switches tabs, render pending break if recent
chrome.tabs.onActivated.addListener(async (activeInfo) => {
	const { pendingBreak } = await chrome.storage.local.get("pendingBreak");
	if (!pendingBreak) return;

	const age = Date.now() - (pendingBreak.triggeredAt || 0);
	if (age < 90000) {
		try {
			const tab = await chrome.tabs.get(activeInfo.tabId);
			if (tab && isValidTab(tab.url)) {
				await sendOrInjectBreak(activeInfo.tabId, pendingBreak);
			}
		} catch (e) {}
	} else {
		await chrome.storage.local.set({ pendingBreak: null });
	}
});

// Runtime message dispatcher
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	(async () => {
		switch (message.type) {
			case "GET_DATA": {
				const data = await chrome.storage.local.get([
					"reminders",
					"settings",
				]);
				const now = Date.now();
				let reminders = (data.reminders || []).filter(
					(r) => r.mode === "recurring" || r.nextTriggerAt > now,
				);
				await chrome.storage.local.set({ reminders });

				sendResponse({
					reminders,
					settings: data.settings || DEFAULT_SETTINGS,
					activityInfo: ACTIVITY_INFO,
				});
				break;
			}

			case "SAVE_REMINDER": {
				const { reminder } = message;
				const data = await chrome.storage.local.get("reminders");
				let reminders = data.reminders || [];

				if (reminder.id) {
					// Edit existing reminder
					const idx = reminders.findIndex(
						(r) => r.id === reminder.id,
					);
					if (idx !== -1) {
						reminders[idx] = {
							...reminders[idx],
							type: reminder.type,
							mode: reminder.mode,
							minutes: reminder.minutes,
							nextTriggerAt:
								Date.now() + reminder.minutes * 60 * 1000,
						};
					} else {
						reminders.push(reminder);
					}
				} else {
					// Add new reminder
					const newReminder = {
						id:
							"rem_" +
							Date.now() +
							"_" +
							Math.random().toString(36).substring(2, 6),
						type: reminder.type || "pausepal-breathe",
						mode: reminder.mode || "recurring",
						minutes: reminder.minutes || 20,
						nextTriggerAt:
							Date.now() + (reminder.minutes || 20) * 60 * 1000,
						createdAt: Date.now(),
					};
					reminders.push(newReminder);
				}

				await chrome.storage.local.set({ reminders });
				await syncAlarms(reminders);
				sendResponse({ success: true, reminders });
				break;
			}

			case "DELETE_REMINDER": {
				const { id } = message;
				const data = await chrome.storage.local.get("reminders");
				let reminders = (data.reminders || []).filter(
					(r) => r.id !== id,
				);

				await chrome.alarms.clear("reminder_" + id);
				await chrome.storage.local.set({ reminders });
				sendResponse({ success: true, reminders });
				break;
			}

			case "SAVE_SETTINGS": {
				const { settings } = message;
				await chrome.storage.local.set({ settings });
				sendResponse({ success: true, settings });
				break;
			}

			case "TRIGGER_TEST": {
				const { activity, settings, tabId } = message;
				const success = await triggerBreak(activity, settings, tabId);
				sendResponse({ success });
				break;
			}

			case "DISMISS_BREAK": {
				await chrome.storage.local.set({ pendingBreak: null });
				broadcastMessage({ type: "HIDE_BREAK" });
				sendResponse({ success: true });
				break;
			}
		}
	})();
	return true;
});

async function broadcastMessage(msg) {
	try {
		const tabs = await chrome.tabs.query({});
		for (const tab of tabs) {
			if (tab.id && isValidTab(tab.url)) {
				chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
			}
		}
	} catch (e) {}
}
