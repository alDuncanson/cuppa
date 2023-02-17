import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;
let timesUp: boolean;
let initialReminderDuration: number;
let reminderDuration: number; // milliseconds
let reminderText: string;
let warningDuration: number; // seconds
let cuppaEmoji: string;

/**
 * Run when cuppa's activation event has triggered the extension
 * 
 * @param context collection of utilities private to the cuppa extension
 */
export function activate({ subscriptions }: vscode.ExtensionContext): void {

	// get workspace configuration values
	let { reminderMessage, reminderTime, warningTime, emoji } = vscode.workspace.getConfiguration('cuppa');

	// listen for configuration changes and update local variables when they do
	vscode.workspace.onDidChangeConfiguration(() => {
		const updatedConfiguration = vscode.workspace.getConfiguration('cuppa');
		reminderText = updatedConfiguration.reminderMessage;
		initialReminderDuration = minutesToMilliseconds(updatedConfiguration.reminderTime);
		warningDuration = updatedConfiguration.warningTime;
		cuppaEmoji = updatedConfiguration.emoji;
	});

	initialReminderDuration = minutesToMilliseconds(reminderTime); // set initial reminder duration to the value in the config, converted to milliseconds
	reminderDuration = initialReminderDuration; // set reminder duration to the initial reminder duration
	reminderText = reminderMessage; // set reminder text to the value in the config
	warningDuration = warningTime; // set warning duration to the value in the config
	timesUp = false; // flag to indicate if the timer has run out
	cuppaEmoji = emoji; // set cuppa emoji to the value in the config

	// register a command that is invoked when the status bar item is selected
	const myCommandId = 'cuppa.resetCuppa';
	subscriptions.push(vscode.commands.registerCommand(myCommandId, () => {
		// do something when status bar item is clicked
		resetTimer();
	}));

	// create a new status bar item
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
	statusBarItem.command = myCommandId;
	statusBarItem.tooltip = 'Click to reset cuppa';
	subscriptions.push(statusBarItem);

	// show timer in status bar
	statusBarItem.show();

	// register a window listener that makes sure the status bar item is
	// up to date when the window is focused
	subscriptions.push(vscode.window.onDidChangeWindowState(updateTimer));

	// run timer function once every second
	setInterval(updateTimer, 1000);
}

/**
 * Updates the status bar item to show the current time
 * If the timer has run out, shows a message
 */
export function updateTimer(): void {
	updateStatus(reminderDuration);

	if (reminderDuration > 0) {
		reminderDuration -= 1000;

		if (reminderDuration < secondsToMilliseconds(warningDuration)) {
			statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
		}
	} else {
		if (timesUp === false) {
			statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
			timesUp = true;
			showMessage();
		}
	}
}

/**
 * Formats the time in milliseconds to a string in the format `#h #m #s`
 * 
 * @param time Time in milliseconds
 * @returns Formatted time string (#h #m #s)
 */
export function formattedTime(time: number): string {
	// converters
	const timeInSeconds = (milliseconds: number): number => Math.floor(milliseconds / 1_000);
	const timeInMinutes = (milliseconds: number): number => Math.floor(timeInSeconds(milliseconds) / 60);
	const timeInHours = (milliseconds: number): number => Math.floor(timeInMinutes(milliseconds) / 60);
	const secondsLeftInHour = (milliseconds: number): number => timeInSeconds(milliseconds) % 60;
	const minutesLefInHour = (milliseconds: number): number => timeInMinutes(milliseconds) % 60;

	// formatters
	const formattedSeconds = (seconds: number): string => `${seconds}s`;
	const formattedMinutes = (minutes: number): string => `${minutes}m `;
	const formattedHours = (hours: number): string => hours ? `${hours}h ` : '';

	// formatted time
	const hours = formattedHours(timeInHours(time));
	const minutes = formattedMinutes(minutesLefInHour(time));
	const seconds = formattedSeconds(secondsLeftInHour(time));

	return `${hours}${minutes}${seconds}`;
}

/**
 * Updates the status bar item to show the current time
 * 
 * @param time Time in milliseconds
 */
export function updateStatus(time: number): void {
	statusBarItem.text = `${cuppaEmoji}   ${formattedTime(time)}`;
}

/**
 * Shows a message box to the user
 */
export function showMessage(): void {
	vscode.window.showInformationMessage(reminderText);
}

/**
 * Resets the timer to the default value
 */
export function resetTimer(): void {
	reminderDuration = initialReminderDuration;
	timesUp = false;
	statusBarItem.backgroundColor = undefined;
}

/**
 * Converts minutes to milliseconds
 * 
 * @param minutes Time in minutes
 * @returns Time in milliseconds
 */
export function minutesToMilliseconds(minutes: number): number {
	return minutes * 60 * 1000;
}

/**
 * Converts seconds to milliseconds
 * @param seconds Time in seconds
 * @returns Time in milliseconds
 */
export function secondsToMilliseconds(seconds: number): number {
	return seconds * 1000;
}