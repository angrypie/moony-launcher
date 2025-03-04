import React from 'react';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import * as windowApi from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

//it doesn't work with current version of the search window because its NSPanel now
//but it could be handly with the other windows
export function useShowHide() {
	const mainWebview = WebviewWindow.getByLabel('main');
	const win = windowApi.getCurrentWindow()
	React.useEffect(() => {
		register('ctrl+alt+space', async (event) => {
			if (event.state === "Pressed") {
					// const monitor = windowApi.currentMonitor()
					const main = await mainWebview
					if (main === null) {
						console.log('main webview is null')
						return
					}
					const visible = await win.isVisible();
					if (visible) {
						await main.hide()
						// setVisible(false)
					} else {
						await main.show()
						await win.setFocus()
						// setVisible(true)
					}

			}
		});
		return () => {
			unregister('ctrl+alt+space')
		};
	});

	const hide = React.useCallback(async () => {
		const main = await mainWebview
		if (main === null) {
			console.log('useShowHide.hide(): main webview is null')
			return
		}
		await main.hide()
	}, []);

	return {
		hide,
	}
}
