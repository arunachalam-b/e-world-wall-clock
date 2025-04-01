// src/App.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { parseISO } from 'date-fns'; // For parsing the specific input format
import TimezoneDisplay from './components/TimezoneDisplay';
import './App.css';

// Define initial IANA timezones corresponding to the requested abbreviations
// IST: Asia/Kolkata
// EST: America/New_York (Handles EST/EDT)
// PST: America/Los_Angeles (Handles PST/PDT)
// UTC: Etc/UTC
// SGT: Asia/Singapore
// JST: Asia/Tokyo
// CST: America/Chicago (Handles CST/CDT) - Assuming US Central Time
const INITIAL_TIMEZONES: string[] = [
  'Asia/Kolkata',    // IST
  'America/New_York', // EST/EDT
  'America/Los_Angeles', // PST/PDT
  'Etc/UTC',          // UTC
  'Asia/Singapore',   // SGT
  'Asia/Tokyo',       // JST
  'America/Chicago',  // CST/CDT
];

function App() {
  const [inputDateTimeString, setInputDateTimeString] = useState<string>('');
  const [baseDate, setBaseDate] = useState<Date>(new Date()); // Default to current time
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedTimezones, setSelectedTimezones] = useState<string[]>(INITIAL_TIMEZONES);
  const [availableTimezones, setAvailableTimezones] = useState<string[]>([]);
  const [selectedNewTimezone, setSelectedNewTimezone] = useState<string>('');

  // Fetch available timezones on mount
  useEffect(() => {
    try {
        // Use Intl API to get standard IANA timezone names supported by the browser
        const tzNames = (Intl as any)?.supportedValuesOf?.('timeZone') || [
          'Etc/UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo'
        ];
        setAvailableTimezones(tzNames.sort());
        // Set default selection for the dropdown if list is not empty
        if (tzNames.length > 0) {
            // Find a common default that isn't already selected, or just the first one
            const defaultSelection = tzNames.find((tz: any) => !INITIAL_TIMEZONES.includes(tz)) || tzNames[0];
            setSelectedNewTimezone(defaultSelection);
        }
    } catch (e) {
        console.error("Error getting supported timezones:", e);
        // Provide a fallback list or handle the error appropriately
        setAvailableTimezones(['Etc/UTC', 'America/New_York', 'Europe/London']); // Basic fallback
    }
  }, []);

  // Update baseDate when input string changes
  useEffect(() => {
    if (inputDateTimeString.trim() === '') {
      // If input is empty, use current time and clear errors
      setBaseDate(new Date());
      setParseError(null);
      return;
    }

    try {
      // Attempt to parse the input string (expects ISO 8601 format like 2025-04-01T15:30:00Z)
      const parsedDate = parseISO(inputDateTimeString);

      // Check if parsing resulted in a valid date
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date format');
      }

      setBaseDate(parsedDate);
      setParseError(null); // Clear error on successful parse
    } catch (error) {
      console.error("Failed to parse date string:", error);
      setParseError('Invalid date format. Please use YYYY-MM-DDTHH:mm:ssZ format (e.g., 2025-04-01T15:30:00Z).');
      // Optional: Keep the last valid date or reset to current time?
      // setBaseDate(new Date()); // Reset to current time on error
    }
  }, [inputDateTimeString]);

  // Handler for adding a new timezone
  const handleAddTimezone = useCallback(() => {
    if (selectedNewTimezone && !selectedTimezones.includes(selectedNewTimezone)) {
      setSelectedTimezones(prev => [...prev, selectedNewTimezone]);
    }
     // Optional: Maybe reset dropdown to first available after adding?
    // const nextAvailable = availableTimezones.find(tz => !selectedTimezones.includes(tz) && tz !== selectedNewTimezone);
    // if (nextAvailable) setSelectedNewTimezone(nextAvailable);

  }, [selectedNewTimezone, selectedTimezones, availableTimezones]);

  // Memoize the filtered list for the dropdown to prevent unnecessary re-renders
   const timezoneOptions = useMemo(() => {
    return availableTimezones.filter(tz => !selectedTimezones.includes(tz));
   }, [availableTimezones, selectedTimezones]);

  // Update current time every second if no input is provided
  useEffect(() => {
    let intervalId: number | undefined = undefined;
    if (inputDateTimeString.trim() === '' && !parseError) {
      // Only run interval if input is empty and there's no parse error state
      intervalId = window.setInterval(() => {
        setBaseDate(new Date());
      }, 1000); // Update every second
    }

    // Cleanup interval on component unmount or when input is entered
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [inputDateTimeString, parseError]); // Rerun effect if input changes or error state changes

  return (
    <div className="app-container">
      <h1>Timezone Converter</h1>

      <div className="input-section">
        <label htmlFor="datetime-input">
          Enter Date & Time (UTC - e.g., 2025-04-01T15:30:00Z):
        </label>
        <input
          type="text"
          id="datetime-input"
          value={inputDateTimeString}
          onChange={(e) => setInputDateTimeString(e.target.value)}
          placeholder="Leave empty for current time"
        />
        {parseError && <p className="error-message">{parseError}</p>}

        <div style={{ marginTop: '15px' }}>
            <label htmlFor="timezone-select">Add Timezone:</label>
             <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <select
                    id="timezone-select"
                    value={selectedNewTimezone}
                    onChange={(e) => setSelectedNewTimezone(e.target.value)}
                    disabled={timezoneOptions.length === 0} // Disable if no more options
                >
                    {timezoneOptions.length === 0 && <option>All timezones added</option>}
                    {timezoneOptions.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                    ))}
                </select>
                <button onClick={handleAddTimezone} disabled={!selectedNewTimezone || timezoneOptions.length === 0}>
                    Add
                </button>
            </div>
        </div>
      </div>

      <h2>Selected Timezones:</h2>
      {baseDate && !parseError ? (
        <div className="timezones-grid">
          {selectedTimezones.map(tz => (
            <TimezoneDisplay key={tz} baseDate={baseDate} timeZone={tz} />
          ))}
        </div>
      ) : (
         // Show message if there's a parse error and we are not showing current time
         parseError && inputDateTimeString.trim() !== '' ? (
            <p>Please correct the date input to see the times.</p>
         ) : (
             // Should ideally not be reached if logic is correct, but as a fallback
             <p>Loading time...</p>
         )
      )}
    </div>
  );
}

export default App;