import React from "react";
// import { invoke } from "@tauri-apps/api/core";
import "./App.css";

import { openUrl } from '@tauri-apps/plugin-opener';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import * as windowApi from '@tauri-apps/api/window';
// import { Webvie}
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

const mainWebview = WebviewWindow.getByLabel('main');
const win = windowApi.getCurrentWindow()

function useShowHide() {
	React.useEffect(() => {
		register('shift+space', async (event) => {
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
			unregister('shift+space')
		};
	});
}


function App() {
  const [request, setRequest] = React.useState("");

	useShowHide()

  async function processCommand() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    // await invoke("greet", { name: request })

		// opens a file using the default program:
		// await openPath('/path/to/file');
		// opens a file using `vlc` command on Windows:
		// await openPath('C:/path/to/file', 'vlc');
	//correct  https://kagi.com/search?q=neovim+tauri+site%3Areddit.com
	//wrong  https://kagi.com/q=neovim%20tauri%20@r
		const encodedRequest = encodeURIComponent(request);
		const url = `https://kagi.com/search?q=${encodedRequest}`;
		await openUrl(url);
  }
	

	const input = React.useCallback((inputElement: HTMLInputElement | null) => {
    if (inputElement) {
      inputElement.focus();
    }
  }, []);
	const searchEmoji = "🔍";
  return (
    <main className="container">
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          processCommand();
        }}
      >
        <input
          id="request-inoput"
					ref={input}
          onChange={(e) => setRequest(e.currentTarget.value)}
          placeholder={`${searchEmoji} Search`}
        />
      </form>
    </main>
  );
}

export default App;
