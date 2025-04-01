import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { parseISO } from 'date-fns';
import TimezoneDisplay from './components/TimezoneDisplay';
import './App.css';

const INITIAL_TIMEZONES: string[] = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Los_Angeles',
  'Etc/UTC',
  'Asia/Singapore',
  'Asia/Tokyo',
  'America/Chicago',
];

function App() {
  const [inputDateTimeString, setInputDateTimeString] = useState<string>('');
  const [baseDate, setBaseDate] = useState<Date>(new Date());
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedTimezones, setSelectedTimezones] = useState<string[]>(INITIAL_TIMEZONES);
  const [availableTimezones, setAvailableTimezones] = useState<string[]>([]);
  const [selectedNewTimezone, setSelectedNewTimezone] = useState<string>('');

  useEffect(() => {
    try {
        const tzNames = (Intl as any)?.supportedValuesOf?.('timeZone') || [
          'Etc/UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo'
        ];
        setAvailableTimezones(tzNames.sort());
        if (tzNames.length > 0) {
            const defaultSelection = tzNames.find((tz: any) => !INITIAL_TIMEZONES.includes(tz)) || tzNames[0];
            setSelectedNewTimezone(defaultSelection);
        }
    } catch (e) {
        console.error("Error getting supported timezones:", e);
        setAvailableTimezones(['Etc/UTC', 'America/New_York', 'Europe/London']);
    }
  }, []);

  useEffect(() => {
    if (inputDateTimeString.trim() === '') {
      setBaseDate(new Date());
      setParseError(null);
      return;
    }

    try {
      const parsedDate = parseISO(inputDateTimeString);

      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date format');
      }

      setBaseDate(parsedDate);
      setParseError(null);
    } catch (error) {
      console.error("Failed to parse date string:", error);
      setParseError('Invalid date format. Please use YYYY-MM-DDTHH:mm:ssZ format (e.g., 2025-04-01T15:30:00Z).');
    }
  }, [inputDateTimeString]);

  const handleAddTimezone = useCallback(() => {
    if (selectedNewTimezone && !selectedTimezones.includes(selectedNewTimezone)) {
      setSelectedTimezones(prev => [selectedNewTimezone, ...prev]);
    }
  }, [selectedNewTimezone, selectedTimezones, availableTimezones]);

  const handleRemoveTimezone = useCallback((timezone: string) => {
    setSelectedTimezones(prev => prev.filter(tz => tz !== timezone));
  }, []);

  const timezoneOptions = useMemo(() => {
    return availableTimezones.filter(tz => !selectedTimezones.includes(tz));
  }, [availableTimezones, selectedTimezones]);

  useEffect(() => {
    let intervalId: number | undefined = undefined;
    if (inputDateTimeString.trim() === '' && !parseError) {
      intervalId = window.setInterval(() => {
        setBaseDate(new Date());
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [inputDateTimeString, parseError]);

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

        <div className="timezone-select-wrapper">
            <label htmlFor="timezone-select">Add Timezone:</label>
             <div className="timezone-select-container">
                <select
                    id="timezone-select"
                    value={selectedNewTimezone}
                    onChange={(e) => setSelectedNewTimezone(e.target.value)}
                    disabled={timezoneOptions.length === 0}
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
            <div key={tz} className="timezone-item">
              <TimezoneDisplay baseDate={baseDate} timeZone={tz} />
              <button 
                onClick={() => handleRemoveTimezone(tz)} 
                className="close-button"
                aria-label={`Remove ${tz}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      ) : (
         parseError && inputDateTimeString.trim() !== '' ? (
            <p>Please correct the date input to see the times.</p>
         ) : (
             <p>Loading time...</p>
         )
      )}
    </div>
  );
}

export default App;
