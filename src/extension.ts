import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;
let timerValue: number;
let timesUp: boolean;

export function activate({ subscriptions }: vscode.ExtensionContext) {

	timerValue = 15000; // countdown timer value in milliseconds
	timesUp = false; // flag to indicate if the timer has run out

	// register a command that is invoked when the status bar
	// item is selected
	const myCommandId = 'remindful.showCountdownTime';
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
	updateStatus(timerValue);

	if (timerValue > 0) {
		timerValue -= 1000;
	} else {
		if (timesUp === false) {
			timesUp = true;
			showMessage();
		}
	}
}

/**
 * Formats the time in milliseconds to a string in the format mm:ss.
 * 
 * @param time Time in milliseconds.
 * @returns Formatted time string.
 */
function formattedTime(time: number): string {
	const minutes = Math.floor(time / 60000);
	const seconds = Math.floor((time % 60000) / 1000);
	return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * Updates the status bar item to show the current time.
 * 
 * @param time Time in milliseconds.
 */
function updateStatus(time: number): void {
	statusBarItem.text = `Time: ${formattedTime(time)}`;
}

/**
 * Shows a message box to the user.
 */
function showMessage(): void {
	vscode.window.showInformationMessage('Time to stand up!');
}

/**
 * Resets the timer to the default value.
 */
function resetTimer(): void {
	timerValue = 15000;
	timesUp = false;
}