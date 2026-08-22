/**
 * PausePal - Popup Logic
 * Complete reminder management (add, edit, delete, countdown),
 * settings management (size, position, play count, sound), and test previews.
 */

document.addEventListener("DOMContentLoaded", async () => {
	// Views
	const viewReminders = document.getElementById("view-reminders");
	const viewSettings = document.getElementById("view-settings");
	const btnToggleSettings = document.getElementById("btn-toggle-settings");
	const btnBackSettings = document.getElementById("btn-back-settings");

	// Form Elements
	const formTitle = document.getElementById("form-title");
	const btnCancelEdit = document.getElementById("btn-cancel-edit");
	const editReminderId = document.getElementById("edit-reminder-id");
	const activityGrid = document.getElementById("activity-grid");
	const inputMinutes = document.getElementById("input-minutes");
	const timeChips = document.getElementById("time-chips");
	const btnSaveReminder = document.getElementById("btn-save-reminder");
	const btnSaveText = document.getElementById("btn-save-text");

	// List Elements
	const remindersCount = document.getElementById("reminders-count");
	const remindersList = document.getElementById("reminders-list");

	// Settings Elements
	const settingSize = document.getElementById("setting-size");
	const placementSettingItem = document.getElementById(
		"placement-setting-item",
	);
	const settingPosition = document.getElementById("setting-position");
	const settingLoops = document.getElementById("setting-loops");
	const settingSound = document.getElementById("setting-sound");
	const btnTestPreview = document.getElementById("btn-test-preview");

	let activeReminders = [];
	let currentSettings = {};
	let activityInfo = {};
	let selectedActivityType = "pausepal-breathe";
	let countdownTimer = null;

	// 1. Initial Data Fetch
	try {
		const data = await chrome.runtime.sendMessage({ type: "GET_DATA" });
		if (data) {
			activeReminders = data.reminders || [];
			currentSettings = data.settings || {};
			activityInfo = data.activityInfo || {};

			renderSettings(currentSettings);
			renderRemindersList(activeReminders);
			startCountdownTicker();
		}
	} catch (err) {
		console.error("Error loading initial data:", err);
	}

	// 2. Navigation between Reminders View and Settings View
	btnToggleSettings.addEventListener("click", () => {
		viewReminders.classList.remove("active");
		viewSettings.classList.add("active");
	});

	btnBackSettings.addEventListener("click", () => {
		viewSettings.classList.remove("active");
		viewReminders.classList.add("active");
	});

	// 3. Activity Type Selection
	activityGrid.addEventListener("click", (e) => {
		const option = e.target.closest(".activity-option");
		if (!option) return;

		activityGrid
			.querySelectorAll(".activity-option")
			.forEach((el) => el.classList.remove("selected"));
		option.classList.add("selected");
		selectedActivityType = option.dataset.type;
	});

	// 4. Timing Input & Suggestion Chips
	inputMinutes.addEventListener("input", () => {
		let val = parseInt(inputMinutes.value, 10);
		if (isNaN(val) || val < 1) val = 1;
		if (val > 720) val = 720;
		updateActiveChip(val);
	});

	timeChips.addEventListener("click", (e) => {
		const chip = e.target.closest(".chip");
		if (!chip) return;
		const val = parseInt(chip.dataset.val, 10);
		inputMinutes.value = val;
		updateActiveChip(val);
	});

	function updateActiveChip(activeVal) {
		timeChips.querySelectorAll(".chip").forEach((chip) => {
			if (parseInt(chip.dataset.val, 10) === parseInt(activeVal, 10)) {
				chip.classList.add("active");
			} else {
				chip.classList.remove("active");
			}
		});
	}

	// 5. Save (Create or Edit) Reminder
	btnSaveReminder.addEventListener("click", async () => {
		const minutes = Math.max(
			1,
			Math.min(720, parseInt(inputMinutes.value, 10) || 20),
		);
		const mode = document.querySelector(
			'input[name="reminder-mode"]:checked',
		).value;
		const existingId = editReminderId.value.trim();

		const reminderPayload = {
			type: selectedActivityType,
			mode,
			minutes,
		};

		if (existingId) {
			reminderPayload.id = existingId;
		}

		const res = await chrome.runtime.sendMessage({
			type: "SAVE_REMINDER",
			reminder: reminderPayload,
		});

		if (res && res.reminders) {
			activeReminders = res.reminders;
			renderRemindersList(activeReminders);
			resetForm();
		}
	});

	// Cancel Edit
	btnCancelEdit.addEventListener("click", () => {
		resetForm();
	});

	function resetForm() {
		editReminderId.value = "";
		formTitle.textContent = "Set Reminder";
		btnSaveText.textContent = "Set Reminder";
		btnCancelEdit.classList.add("hidden");

		inputMinutes.value = 20;
		updateActiveChip(20);

		const defaultMode = document.querySelector(
			'input[name="reminder-mode"][value="recurring"]',
		);
		if (defaultMode) defaultMode.checked = true;

		activityGrid
			.querySelectorAll(".activity-option")
			.forEach((el) => el.classList.remove("selected"));
		const defaultOption = activityGrid.querySelector(
			'[data-type="pausepal-breathe"]',
		);
		if (defaultOption) defaultOption.classList.add("selected");
		selectedActivityType = "pausepal-breathe";
	}

	// 6. Render Reminders List
	function renderRemindersList(reminders) {
		remindersCount.textContent = reminders.length;
		remindersList.replaceChildren();

		if (reminders.length === 0) {
			const emptyDiv = document.createElement("div");
			emptyDiv.className = "empty-state";
			emptyDiv.textContent =
				"No active reminders. Add one above to get started.";
			remindersList.appendChild(emptyDiv);
			return;
		}

		reminders.forEach((r) => {
			const info = activityInfo[r.type] || { title: "Break", icon: "🐹" };
			const modeLabel =
				r.mode === "recurring"
					? `Repeats every ${r.minutes}m`
					: "One-time";

			const item = document.createElement("div");
			item.className = "reminder-item";

			const main = document.createElement("div");
			main.className = "reminder-main";

			const iconSpan = document.createElement("span");
			iconSpan.className = "reminder-icon";
			iconSpan.textContent = info.icon || "🐹";

			const details = document.createElement("div");
			details.className = "reminder-details";

			const titleSpan = document.createElement("span");
			titleSpan.className = "reminder-title";
			titleSpan.textContent = info.title || "Break";

			const meta = document.createElement("div");
			meta.className = "reminder-meta";

			const modeSpan = document.createElement("span");
			modeSpan.textContent = modeLabel;

			const dotSpan = document.createElement("span");
			dotSpan.textContent = "•";

			const countdownSpan = document.createElement("span");
			countdownSpan.className = "reminder-countdown";
			countdownSpan.dataset.trigger = r.nextTriggerAt;
			countdownSpan.textContent = "--:--";

			meta.appendChild(modeSpan);
			meta.appendChild(dotSpan);
			meta.appendChild(countdownSpan);

			details.appendChild(titleSpan);
			details.appendChild(meta);

			main.appendChild(iconSpan);
			main.appendChild(details);

			const actions = document.createElement("div");
			actions.className = "reminder-actions";

			const btnEdit = document.createElement("button");
			btnEdit.className = "btn-action btn-edit";
			btnEdit.dataset.id = r.id;
			btnEdit.title = "Edit Reminder";
			btnEdit.innerHTML =
				'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';

			const btnDelete = document.createElement("button");
			btnDelete.className = "btn-action btn-delete";
			btnDelete.dataset.id = r.id;
			btnDelete.title = "Delete Reminder";
			btnDelete.innerHTML =
				'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';

			btnEdit.addEventListener("click", () => {
				loadReminderIntoForm(r);
			});

			btnDelete.addEventListener("click", async () => {
				const res = await chrome.runtime.sendMessage({
					type: "DELETE_REMINDER",
					id: r.id,
				});
				if (res && res.reminders) {
					activeReminders = res.reminders;
					renderRemindersList(activeReminders);
					if (editReminderId.value === r.id) {
						resetForm();
					}
				}
			});

			actions.appendChild(btnEdit);
			actions.appendChild(btnDelete);

			item.appendChild(main);
			item.appendChild(actions);

			remindersList.appendChild(item);
		});

		updateCountdowns();
	}

	function loadReminderIntoForm(reminder) {
		editReminderId.value = reminder.id;
		formTitle.textContent = "Edit Reminder";
		btnSaveText.textContent = "Update Reminder";
		btnCancelEdit.classList.remove("hidden");

		inputMinutes.value = reminder.minutes;
		updateActiveChip(reminder.minutes);

		const modeInput = document.querySelector(
			`input[name="reminder-mode"][value="${reminder.mode}"]`,
		);
		if (modeInput) modeInput.checked = true;

		activityGrid.querySelectorAll(".activity-option").forEach((el) => {
			if (el.dataset.type === reminder.type) {
				el.classList.add("selected");
				selectedActivityType = reminder.type;
			} else {
				el.classList.remove("selected");
			}
		});

		viewReminders.scrollTop = 0;
	}

	// 7. Live Countdown Ticker
	function startCountdownTicker() {
		if (countdownTimer) clearInterval(countdownTimer);
		updateCountdowns();
		countdownTimer = setInterval(updateCountdowns, 1000);
	}

	function updateCountdowns() {
		const countdownEls = document.querySelectorAll(".reminder-countdown");
		const now = Date.now();

		countdownEls.forEach((el) => {
			const triggerAt = parseInt(el.dataset.trigger, 10);
			const diff = triggerAt - now;

			if (diff <= 0) {
				el.textContent = "Triggering...";
			} else {
				const totalSec = Math.floor(diff / 1000);
				const min = Math.floor(totalSec / 60);
				const sec = totalSec % 60;
				if (min >= 60) {
					const hrs = Math.floor(min / 60);
					const remMin = min % 60;
					el.textContent = `in ${hrs}h ${remMin}m`;
				} else {
					el.textContent = `in ${min}m ${String(sec).padStart(2, "0")}s`;
				}
			}
		});
	}

	// 8. Settings Management
	function renderSettings(settings) {
		settingSize.value = settings.size || "fullscreen";
		settingPosition.value = settings.position || "bottom-right";
		settingLoops.value = String(
			typeof settings.loopCount === "number" ? settings.loopCount : 2,
		);
		settingSound.checked = settings.sound !== false;

		togglePlacementVisibility(settingSize.value);
	}

	function togglePlacementVisibility(size) {
		if (size === "fullscreen") {
			placementSettingItem.style.display = "none";
		} else {
			placementSettingItem.style.display = "flex";
		}
	}

	async function saveCurrentSettings() {
		const updatedSettings = {
			...currentSettings,
			size: settingSize.value,
			position: settingPosition.value,
			loopCount: parseInt(settingLoops.value, 10),
			sound: settingSound.checked,
		};
		currentSettings = updatedSettings;

		await chrome.runtime.sendMessage({
			type: "SAVE_SETTINGS",
			settings: updatedSettings,
		});
	}

	settingSize.addEventListener("change", () => {
		togglePlacementVisibility(settingSize.value);
		saveCurrentSettings();
	});

	settingPosition.addEventListener("change", () => {
		saveCurrentSettings();
	});

	settingLoops.addEventListener("change", () => {
		saveCurrentSettings();
	});

	settingSound.addEventListener("change", () => {
		saveCurrentSettings();
	});

	btnTestPreview.addEventListener("click", async () => {
		const [tab] = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		if (
			tab &&
			tab.url &&
			(tab.url.startsWith("chrome://") ||
				tab.url.startsWith("chrome-extension://") ||
				tab.url.startsWith("moz-extension://") ||
				tab.url.startsWith("resource://") ||
				tab.url.startsWith("edge://") ||
				tab.url.startsWith("about:") ||
				tab.url.startsWith("view-source:"))
		) {
			alert(
				"Notice: Browsers restrict extensions on internal pages. Please switch to a regular website (e.g. google.com) to test.",
			);
			return;
		}

		await chrome.runtime.sendMessage({
			type: "TRIGGER_TEST",
			activity: selectedActivityType,
			settings: currentSettings,
			tabId: tab ? tab.id : null,
		});
		window.close();
	});
});
