import { formatInTimeZone, toZonedTime as utcToZonedTime } from 'date-fns-tz';
import React, { useMemo } from 'react';
import Clock from 'react-clock';
import 'react-clock/dist/Clock.css';

interface TimezoneDisplayProps {
    baseDate: Date;
    timeZone: string;
}

const TimezoneDisplay: React.FC<TimezoneDisplayProps> = ({ baseDate, timeZone }) => {
    const { digitalTime, analogTimeLabel, zonedDate, displayName } = useMemo(() => {
        try {
            const zoned = utcToZonedTime(baseDate, timeZone);
            const digital = formatInTimeZone(baseDate, timeZone, 'HH:mm:ss');
            const analogLabel = formatInTimeZone(baseDate, timeZone, 'hh:mm:ss a');
            const nameParts = timeZone.split('/');
            const display = nameParts.length > 1 ? nameParts[1].replace(/_/g, ' ') : timeZone;

            return {
                digitalTime: digital,
                analogTimeLabel: analogLabel,
                zonedDate: zoned,
                displayName: display,
            };
        } catch (error) {
            console.error(`Error processing timezone ${timeZone}:`, error);
            return {
                digitalTime: 'Error',
                analogTimeLabel: 'Error',
                zonedDate: new Date(),
                displayName: timeZone + ' (Error)',
            };
        }
    }, [baseDate, timeZone]);

    return (
        <div className="timezone-card">
            <h3>{displayName} ({timeZone})</h3>
            <div className="clock-container">
                <div className="analog-clock-wrapper">
                    <Clock
                        value={zonedDate}
                        size={100}
                        hourHandWidth={4}
                        minuteHandWidth={2}
                        secondHandWidth={1}
                        renderSecondHand={true}
                    />
                    <span>{analogTimeLabel.slice(-2)}</span>
                </div>
                <div className="digital-clock">
                    {digitalTime}
                </div>
            </div>
        </div>
    );
};

export default TimezoneDisplay;
