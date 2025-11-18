import { set } from "date-fns";
import { Timestamp } from "firebase/firestore";

export default function GetDateTimestamp(start, end) {
  console.log(start);
  const yearStart = start.getFullYear();
  const monthStart = String(start.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const dayStart = String(start.getDate()).padStart(2, "0");
  const formattedDateStart = `${yearStart}-${monthStart}-${dayStart}`;
  // end
  const yearEnd = end.getFullYear();
  const monthEnd = String(end.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const dayEnd = String(end.getDate()).padStart(2, "0");
  const formattedDateEnd = `${yearEnd}-${monthEnd}-${dayEnd}`;
  //
  const startTimestamp = Timestamp.fromDate(new Date(formattedDateStart));
  const endTimestamp = Timestamp.fromDate(
    set(new Date(formattedDateEnd), {
      hours: 23,
      minutes: 59,
      seconds: 59,
      milliseconds: 999,
    })
  );
  return {
    start: startTimestamp,
    end: endTimestamp,
  };
}
