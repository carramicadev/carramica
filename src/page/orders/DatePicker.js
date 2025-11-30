import { useState } from "react";
import {
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isWithinInterval,
  isSameDay,
  format,
} from "date-fns";
import { id as localeID } from "date-fns/locale";
import { Modal, Button } from "react-bootstrap";

const presets = [
  { key: "today", label: "Hari Ini" },
  { key: "this_month", label: "Bulan Ini" },
  { key: "last_7", label: "7 Hari Terakhir" },
  { key: "last_30", label: "30 Hari Terakhir" },
  { key: "last_90", label: "90 Hari Terakhir" },
];

export default function DateRangePickerPopup({
  filterByDate,
  rules,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) {
  const [show, setShow] = useState(false);
  const [preset, setPreset] = useState("today");
  const [manualSelecting, setManualSelecting] = useState(false);
  const [hoveredDate, setHoveredDate] = useState(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  console.log(startDate, endDate);
  const applyPreset = (key, move) => {
    const today = new Date();
    let s = today;
    let e = today;
    setPreset(key);

    const delta =
      key === "last_7"
        ? 7
        : key === "last_30"
        ? 30
        : key === "last_90"
        ? 90
        : 0;

    if (key === "today") {
      if (move === "prev") {
        s = subDays(startDate, 1);
        e = subDays(endDate, 1);
        filterByDate(s, e, rules);
      } else if (move === "next") {
        s = addDays(startDate, 1);
        e = addDays(endDate, 1);
        filterByDate(s, e, rules);
        if (e > today) e = today;
        if (s > today) s = today;
      } else {
        s = e = today;
      }
      setCurrentMonth(s);
    }

    if (key === "this_month") {
      if (move === "prev") {
        s = subMonths(startDate, 1);
        e = endOfMonth(s);
        filterByDate(s, e, rules);
      } else if (move === "next") {
        s = addMonths(startDate, 1);
        e = endOfMonth(s);
        filterByDate(s, e, rules);
      } else {
        s = startOfMonth(today);
        e = endOfMonth(today);
      }

      // Update calendar view to match selected preset range
      setCurrentMonth(s);
    }

    if (["last_7", "last_30", "last_90"].includes(key)) {
      if (move === "prev") {
        s = subDays(startDate, delta);
        e = subDays(endDate, delta);
        filterByDate(s, e, rules);
      } else if (move === "next") {
        s = addDays(startDate, delta);
        e = addDays(endDate, delta);
        filterByDate(s, e, rules);
        if (e > today) e = today;
        if (s > today) s = today;
      } else {
        s = subDays(today, delta - 1);
        e = today;
      }
    }

    setManualSelecting(false);
    setStartDate(s);
    setEndDate(e);
  };

  const onDateClick = (day) => {
    setManualSelecting(true);
    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
      return;
    }
    if (day < startDate) {
      setStartDate(day);
      setEndDate(startDate);
      return;
    }
    setEndDate(day);
  };

  const renderCalendar = (monthDate) => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start, end });

    return (
      <div style={{ width: "100%" }}>
        <h5 className="text-center mb-2">
          {format(monthDate, "MMMM yyyy", { locale: localeID })}
        </h5>

        <div
          className="d-grid text-center"
          style={{
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
          }}
        >
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
            <div key={d} className="fw-bold small text-secondary">
              {d}
            </div>
          ))}

          {days.map((day) => {
            let inRange = false;

            if (startDate && endDate) {
              inRange = isWithinInterval(day, {
                start: startDate,
                end: endDate,
              });
            }

            if (manualSelecting && startDate && !endDate && hoveredDate) {
              const rangeStart =
                startDate < hoveredDate ? startDate : hoveredDate;
              const rangeEnd =
                startDate > hoveredDate ? startDate : hoveredDate;
              inRange = isWithinInterval(day, {
                start: rangeStart,
                end: rangeEnd,
              });
            }

            const isStart = startDate && isSameDay(day, startDate);
            const isEnd = endDate && isSameDay(day, endDate);

            const className = `
  py-2 rounded 
  ${inRange ? "bg-success bg-opacity-25" : ""}
  ${isStart || isEnd ? "bg-success text-white fw-bold" : ""}
`;

            return (
              <div
                key={day.toISOString()}
                className={className}
                style={{ cursor: "pointer" }}
                onClick={() => onDateClick(day)}
                onMouseEnter={() => setHoveredDate(day)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                {format(day, "d")}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  //   terapkan
  const handleSet = () => {
    filterByDate(startDate, endDate, rules);
    setShow(false);
  };

  const displayRange =
    startDate &&
    `${format(startDate, "dd MMM yyyy", {
      locale: localeID,
    })} - ${format(endDate || startDate, "dd MMM yyyy", { locale: localeID })}`;

  return (
    <div className="p-3 pt-0">
      <p
        style={{
          justifyContent: "center",
          marginRight: "5px",
          marginTop: "5px",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        Date Order
      </p>
      <div className="d-flex align-items-center gap-3 mb-3">
        <Button
          variant="outline-secondary"
          disabled={manualSelecting || !startDate}
          onClick={() => applyPreset(preset, "prev")}
        >
          &lt;
        </Button>

        <div
          className="px-3 py-2 border rounded bg-white shadow-sm"
          style={{ cursor: "pointer", minWidth: 230 }}
          onClick={() => setShow(true)}
        >
          <strong>{displayRange}</strong>
        </div>

        <Button
          variant="outline-secondary"
          disabled={manualSelecting || !startDate}
          onClick={() => applyPreset(preset, "next")}
        >
          &gt;
        </Button>
      </div>

      <Modal
        style={{
          top: "50%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          marginRight: "-50%",
          transform: "translate(-50%, -50%)",
          width: "auto",
          height: "auto",
          overFlowY: "auto",
        }}
        show={show}
        onHide={() => setShow(false)}
        centered
        size="lg"
      >
        <Modal.Body className="p-0">
          <div className="d-flex" style={{ minHeight: 420 }}>
            <div className="border-end p-3 bg-light" style={{ width: 200 }}>
              {presets.map((p) => (
                <div
                  key={p.key}
                  className={`p-2 mb-2 rounded ${
                    preset === p.key && !manualSelecting
                      ? "bg-success  text-white"
                      : "bg-white border"
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setManualSelecting(false);
                    applyPreset(p.key);
                  }}
                >
                  {p.label}
                </div>
              ))}
            </div>

            <div className="flex-grow-1 p-3">
              <div className="d-flex justify-content-between mb-3">
                <Button
                  variant="outline-secondary"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  &lt;
                </Button>

                <strong className="fs-5">
                  {format(currentMonth, "MMMM yyyy", {
                    locale: localeID,
                  })}
                </strong>

                <Button
                  variant="outline-secondary"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  &gt;
                </Button>
              </div>

              <div className="d-flex gap-4">
                {renderCalendar(currentMonth)}
                {renderCalendar(addMonths(currentMonth, 1))}
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Batal
          </Button>
          <Button variant="success" disabled={!endDate} onClick={handleSet}>
            Terapkan
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
