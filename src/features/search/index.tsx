import React from "react";
import { invoke } from "@tauri-apps/api/core";
import "./search.css";

import { openUrl } from '@tauri-apps/plugin-opener';

const Commands = {
	app: {
		show: () => invoke('show'),
		hide: () => invoke('hide'),
	}
}


const useHistory = () => {
	const [history, setHistory] = React.useState<string[]>([]);

	function add(value: string) {
		setHistory((history) => [...history, value]);
	}


	function search(value: string) {
		const searchTerm = value.toLowerCase();
		const filteredHistory = history.filter((item) => item.toLowerCase().includes(searchTerm));
		setHistory(filteredHistory);
	}


	return {
		history,
		add,
		search,
	}
}

export function Search() {
  const [request, setRequest] = React.useState("");
	// const [matches, setMatches] = React.useState<string[]>([]);

	const history = useHistory()

  async function processCommand() {
		const encodedRequest = encodeURIComponent(request);
		const url = `https://kagi.com/search?q=${encodedRequest}`;
		await openUrl(url);

		history.add(request)
    setRequest("");
		Commands.app.hide()
  }
	

	const input = React.useCallback((inputElement: HTMLInputElement | null) => {
    if (inputElement) {
      inputElement.focus();
    }
  }, []);
	const moonEmoji = "🌕"
	const searchEmoji = moonEmoji
	// const searchEmoji = "🔍"
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
					//disable correction
					spellCheck={false}
          id="request-inoput"
					ref={input}
          onChange={(e) => setRequest(e.currentTarget.value)}
          placeholder={` ${searchEmoji} Search`}
        />
      </form>
    </main>
  );
}
