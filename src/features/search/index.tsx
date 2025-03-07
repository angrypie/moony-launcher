import React, { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./search.css";
import Database from '@tauri-apps/plugin-sql';
import { openUrl } from '@tauri-apps/plugin-opener';

const Commands = {
	app: {
		show: () => invoke('show'),
		hide: () => invoke('hide'),
	}
}

// Interface for search history items
interface SearchHistoryItem {
  id: number;
  query: string;
  last_access_time: string;
  access_count: number;
}

const useHistory = () => {
	const [history, setHistory] = React.useState<SearchHistoryItem[]>([]);
  const [db, setDb] = React.useState<Database | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Initialize database connection
  useEffect(() => {
    const initDb = async () => {
      try {
				//TODO move dataase connection to store (jotai?)
        const database = await Database.load('sqlite:moony_launcher.db');
        setDb(database);
        await loadHistoryFromDb(database);
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setLoading(false);
      }
    };
    
    initDb();
  }, []);

  // Load history from database
  const loadHistoryFromDb = async (database: Database) => {
    try {
      const result = await database.select<SearchHistoryItem[]>(
        'SELECT * FROM searches ORDER BY access_count DESC, last_access_time DESC LIMIT 10'
      );
      setHistory(result);
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  // Add a search query to history
  async function add(value: string) {
    if (!db || !value.trim()) return;
    
    const currentTime = new Date().toISOString();
    
    try {
      // Check if the search query already exists
      const existingResult = await db.select<SearchHistoryItem[]>(
        'SELECT * FROM searches WHERE query = $1',
        [value]
      );
      
      if (existingResult.length > 0) {
        // Update existing record
        const item = existingResult[0];
        await db.execute(
          'UPDATE searches SET last_access_time = $1, access_count = $2 WHERE id = $3',
          [currentTime, item.access_count + 1, item.id]
        );
      } else {
        // Insert new record
        await db.execute(
          'INSERT INTO searches (query, last_access_time, access_count) VALUES ($1, $2, $3)',
          [value, currentTime, 1]
        );
      }
      
      // Reload history
      await loadHistoryFromDb(db);
    } catch (error) {
      console.error('Failed to save search query:', error);
    }
  }

  // Search through history based on input
  async function search(value: string) {
    if (!db) return;
    
    try {
      if (!value.trim()) {
        // If empty search, load most used queries
        await loadHistoryFromDb(db);
      } else {
        // Search for matching queries
        const result = await db.select<SearchHistoryItem[]>(
          'SELECT * FROM searches WHERE query LIKE $1 ORDER BY access_count DESC, last_access_time DESC LIMIT 10',
          [`%${value}%`]
        );
        setHistory(result);
      }
    } catch (error) {
      console.error('Failed to search history:', error);
    }
  }

	return {
		history,
		add,
		search,
    loading
	}
}

export function Search() {
  const [request, setRequest] = React.useState("");
	const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = React.useState(-1);
	const history = useHistory();

  // Update suggestions when request changes
  useEffect(() => {
    if (request.trim()) {
      history.search(request);
    } else {
      setSuggestions([]);
    }
  }, [request]);

  // Update suggestions when history changes
  useEffect(() => {
    setSuggestions(history.history.map(item => item.query));
  }, [history.history]);

  async function processCommand() {
		const encodedRequest = encodeURIComponent(request);
		const url = `https://kagi.com/search?q=${encodedRequest}`;
		await openUrl(url);

		await history.add(request);
    setRequest("");
		Commands.app.hide();
  }
	
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && selectedSuggestion >= 0) {
      e.preventDefault();
      setRequest(suggestions[selectedSuggestion]);
      processCommand();
    }
  }

	const input = React.useCallback((inputElement: HTMLInputElement | null) => {
    if (inputElement) {
      inputElement.focus();
    }
  }, []);
	const moonEmoji = "🌕";
	const searchEmoji = moonEmoji;
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
          id="request-input"
					ref={input}
          onChange={(e) => setRequest(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder={` ${searchEmoji} Search`}
          value={request}
        />
        {suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`suggestion ${index === selectedSuggestion ? 'selected' : ''}`}
                onClick={() => {
                  setRequest(suggestion);
                  processCommand();
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </form>
    </main>
  );
}
