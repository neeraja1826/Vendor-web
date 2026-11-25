import { useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseDate(value) {
  if (!value) return new Date();
  const [year, month, day] = value.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDate(value, includeTime) {
  if (!value) return 'Select date';

  const formattedDate = parseDate(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  if (!includeTime) return formattedDate;
  return `${formattedDate} · ${value.split('T')[1]?.slice(0, 5) || '00:00'}`;
}

function isOutsideRange(value, min, max) {
  return Boolean((min && value < min) || (max && value > max));
}

export default function CalendarDatePicker({
  label,
  value,
  min,
  max,
  onChange,
  includeTime = false,
  required = false,
  disabled = false,
  id,
  style,
  className = '',
}) {
  const rootRef = useRef(null);
  const generatedId = useId();
  const triggerId = id || generatedId;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('days');
  const [selectedTime, setSelectedTime] = useState('00:00');
  const [displayDate, setDisplayDate] = useState(() => parseDate(value));
  const [yearPageStart, setYearPageStart] = useState(
    () => Math.floor(parseDate(value).getFullYear() / 12) * 12
  );

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const monthName = displayDate.toLocaleString('en', { month: 'long' });
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  function openCalendar() {
    const selectedDate = parseDate(value);
    setDisplayDate(selectedDate);
    setYearPageStart(Math.floor(selectedDate.getFullYear() / 12) * 12);
    setSelectedTime(value?.split('T')[1]?.slice(0, 5) || '00:00');
    setView('days');
    setOpen(true);
  }

  function moveCalendar(direction) {
    if (view === 'years') {
      setYearPageStart((current) => current + direction * 12);
      return;
    }

    setDisplayDate((current) =>
      view === 'months'
        ? new Date(current.getFullYear() + direction, current.getMonth(), 1)
        : new Date(current.getFullYear(), current.getMonth() + direction, 1)
    );
  }

  function selectYear(selectedYear) {
    setDisplayDate(
      (current) => new Date(selectedYear, current.getMonth(), 1)
    );
    setView('months');
  }

  function selectMonth(selectedMonth) {
    setDisplayDate(
      (current) => new Date(current.getFullYear(), selectedMonth, 1)
    );
    setView('days');
  }

  const years = Array.from({ length: 12 }, (_, index) => yearPageStart + index);
  const yearPageEnd = yearPageStart + years.length - 1;
  const monthLabels = Array.from({ length: 12 }, (_, index) =>
    new Date(2020, index, 1).toLocaleString('en', { month: 'short' })
  );
  const calendarTitle = view === 'years'
    ? 'Select year'
    : view === 'months'
      ? 'Select month'
      : `${monthName} ${year}`;

  return (
    <div
      className={`calendar-date-picker ${className}`.trim()}
      ref={rootRef}
    >
      <style>{`
        .calendar-date-picker {
          position: relative;
          display: grid;
          gap: 5px;
          color: var(--muted, #74695e);
          font-size: 11px;
          font-weight: 650;
        }

        .calendar-date-trigger {
          display: block;
          width: 100%;
          min-width: 0;
          min-height: 38px;
          padding: 0 34px 0 10px;
          border: 1px solid var(--border, #d8e0d6);
          border-radius: 9px;
          color: var(--brand-primary, #24352b);
          background: #fff;
          font: inherit;
          font-size: 12px;
          text-align: left;
          cursor: pointer;
        }

        .calendar-date-picker .calendar-date-trigger {
          padding-right: 34px;
        }

        .calendar-date-icon {
          position: absolute;
          right: 10px;
          bottom: 11px;
          pointer-events: none;
          color: var(--muted, #74695e);
        }

        .calendar-date-trigger:focus-visible,
        .calendar-popup button:focus-visible {
          outline: 3px solid rgba(46, 105, 80, 0.18);
          outline-offset: 1px;
        }

        .calendar-date-trigger:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .calendar-popup {
          position: absolute;
          z-index: 20;
          top: calc(100% + 6px);
          left: 0;
          width: 276px;
          padding: 12px;
          border: 1px solid var(--border, #d8e0d6);
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 12px 30px rgba(27, 47, 36, 0.18);
          color: var(--brand-primary, #24352b);
        }

        .calendar-popup-header {
          display: grid;
          grid-template-columns: 32px 1fr 32px;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
        }

        .calendar-popup-header button,
        .calendar-grid button {
          border: 0;
          border-radius: 7px;
          color: inherit;
          background: transparent;
          font: inherit;
          cursor: pointer;
        }

        .calendar-popup-nav {
          display: grid;
          width: 30px;
          height: 30px;
          place-items: center;
        }

        .calendar-popup-nav:hover,
        .calendar-grid button:hover:not(:disabled) {
          background: rgba(46, 105, 80, 0.1);
        }

        .calendar-popup-title {
          min-width: 0;
          padding: 6px 2px;
          font-size: 13px;
          font-weight: 750;
          text-align: center;
        }

        button.calendar-popup-title {
          cursor: pointer;
        }

        .calendar-popup-years,
        .calendar-popup-months {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 5px;
        }

        .calendar-popup-days {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 3px;
        }

        .calendar-grid button {
          min-width: 0;
          min-height: 34px;
          padding: 4px;
          font-size: 12px;
        }

        .calendar-grid button[aria-pressed="true"] {
          color: #fff;
          background: var(--brand-secondary, #315e46);
        }

        .calendar-grid button:disabled {
          color: #b7bdb9;
          cursor: not-allowed;
        }

        .calendar-weekday {
          padding: 5px 0;
          color: var(--muted, #74695e);
          font-size: 10px;
          font-weight: 650;
          text-align: center;
        }

        .calendar-day-empty {
          min-height: 34px;
        }

        .calendar-time-field {
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--border, #d8e0d6);
          color: var(--muted, #74695e);
          font-size: 11px;
        }

        .calendar-time-field input {
          min-height: 34px;
          padding: 4px 8px;
          border: 1px solid var(--border, #d8e0d6);
          border-radius: 7px;
          color: var(--brand-primary, #24352b);
          background: #fff;
          font: inherit;
        }

        @media (max-width: 420px) {
          .calendar-popup {
            width: min(276px, calc(100vw - 42px));
          }
        }
      `}</style>

      {label && <label htmlFor={triggerId}>{label}</label>}
      <input
        id={triggerId}
        type="text"
        className="calendar-date-trigger"
        value={formatDate(value, includeTime)}
        readOnly
        required={required}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-required={required}
        onClick={() => {
          if (!disabled) openCalendar();
        }}
        onKeyDown={(event) => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            openCalendar();
          }
        }}
        style={{ ...style, paddingRight: '34px' }}
      />
      <CalendarDays className="calendar-date-icon" size={15} aria-hidden="true" />

      {open && (
        <div
          className="calendar-popup"
          role="dialog"
          aria-label={`${label || 'Select'} date picker`}
        >
          <div className="calendar-popup-header">
            <button
              type="button"
              className="calendar-popup-nav"
              aria-label={view === 'years' ? 'Previous years' : 'Previous'}
              onClick={() => moveCalendar(-1)}
            >
              <ChevronLeft size={16} />
            </button>
            {view === 'days' ? (
              <button
                type="button"
                className="calendar-popup-title"
                onClick={() => setView('years')}
              >
                {calendarTitle}
              </button>
            ) : (
              <span className="calendar-popup-title">
                {view === 'years'
                  ? `${calendarTitle} · ${yearPageStart}–${yearPageEnd}`
                  : `${calendarTitle} · ${year}`}
              </span>
            )}
            <button
              type="button"
              className="calendar-popup-nav"
              aria-label={view === 'years' ? 'Next years' : 'Next'}
              onClick={() => moveCalendar(1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {view === 'years' ? (
            <div className="calendar-grid calendar-popup-years">
              {years.map((optionYear) => (
                <button
                  type="button"
                  key={optionYear}
                  aria-pressed={optionYear === year}
                  onClick={() => selectYear(optionYear)}
                >
                  {optionYear}
                </button>
              ))}
            </div>
          ) : view === 'months' ? (
            <div className="calendar-grid calendar-popup-months">
              {monthLabels.map((optionMonth, index) => (
                <button
                  type="button"
                  key={optionMonth}
                  aria-pressed={index === month}
                  onClick={() => selectMonth(index)}
                >
                  {optionMonth}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="calendar-grid calendar-popup-days">
                {weekdays.map((weekday) => (
                  <span className="calendar-weekday" key={weekday}>
                    {weekday}
                  </span>
                ))}
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return (
                      <span
                        className="calendar-day-empty"
                        key={`empty-${index}`}
                      />
                    );
                  }

                  const dateValue = toDateValue(
                    new Date(year, month, day)
                  );

                  return (
                    <button
                      type="button"
                      key={dateValue}
                      aria-pressed={dateValue === value.split('T')[0]}
                      disabled={isOutsideRange(dateValue, min, max)}
                      onClick={() => {
                        onChange(
                          includeTime
                            ? `${dateValue}T${selectedTime}`
                            : dateValue
                        );
                        setOpen(false);
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              {includeTime && (
                <label className="calendar-time-field">
                  Time
                  <input
                    type="time"
                    value={selectedTime}
                    disabled={disabled}
                    onChange={(event) => {
                      const time = event.target.value;
                      setSelectedTime(time);
                      if (value) {
                        onChange(`${value.split('T')[0]}T${time}`);
                      }
                    }}
                  />
                </label>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
