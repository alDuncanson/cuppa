import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;
let timesUp: boolean;
let initialReminderDuration: number;
let reminderDuration: number;
let reminderText: string;

/**
 * Run when cuppa's activation event has triggered the extension
 * 
 * @param context collection of utilities private to the cuppa extension
 */
export function activate({ subscriptions }: vscode.ExtensionContext): void {

	// get workspace configuration values
	let { reminderMessage, reminderTime } = vscode.workspace.getConfiguration('cuppa');

	// listen for configuration changes and update local variables when they do
	vscode.workspace.onDidChangeConfiguration(() => {
		const updatedConfiguration = vscode.workspace.getConfiguration('cuppa');
		reminderText = updatedConfiguration.reminderMessage;
		initialReminderDuration = millisecondsToMinutes(updatedConfiguration.reminderTime);
	});

	initialReminderDuration = millisecondsToMinutes(reminderTime); // set initial reminder duration to the value in the config, converted to milliseconds
	reminderDuration = initialReminderDuration;
	reminderText = reminderMessage;
	timesUp = false; // flag to indicate if the timer has run out

	// register a command that is invoked when the status bar item is selected
	const myCommandId = 'cuppa.showCountdownTime';
	subscriptions.push(vscode.commands.registerCommand(myCommandId, () => {
		// do something when status bar item is clicked
		resetTimer();
	}));

	// create a new status bar item
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
	statusBarItem.command = myCommandId;
	statusBarItem.tooltip = 'Click to reset timer';
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
 * Updates the status bar item to show the current time.
 * If the timer has run out, shows a message.
 */
function updateTimer(): void {
	updateStatus(reminderDuration);

	if (reminderDuration > 0) {
		reminderDuration -= 1000;

		if (reminderDuration < 10000) {
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
 * Formats the time in milliseconds to a string in the format `#h #m #s`.
 * 
 * @param time Time in milliseconds.
 * @returns Formatted time string (#h #m #s).
 */
function formattedTime(time: number): string {
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
 * Updates the status bar item to show the current time.
 * 
 * @param time Time in milliseconds.
 */
function updateStatus(time: number): void {
	statusBarItem.text = `🍵   ${formattedTime(time)}`;
}

/**
 * Shows a message box to the user.
 */
function showMessage(): void {
	vscode.window.showInformationMessage(reminderText);
}

/**
 * Resets the timer to the default value.
 */
function resetTimer(): void {
	reminderDuration = initialReminderDuration;
	timesUp = false;
	statusBarItem.backgroundColor = undefined;
}

/**
 * Converts milliseconds to minutes.
 * 
 * @param milliseconds Time in milliseconds.
 * @returns Time in minutes.
 */
function millisecondsToMinutes(milliseconds: number): number {
	return milliseconds * 60 * 1000;
}