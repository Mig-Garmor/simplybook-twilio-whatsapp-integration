export function formatDate(dateString) {
  const date = new Date(dateString);

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayOfWeek = daysOfWeek[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  // Function to add ordinal suffix to day of the month
  function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return "th"; // covers 11th to 19th
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  const dayWithSuffix = day + getOrdinalSuffix(day);

  // Method to return the time in AM/PM format

  let hours = date.getHours();
  let minutes = date.getMinutes();
  let ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // If the hour is 0, display it as 12
  minutes = minutes < 10 ? "0" + minutes : minutes; // Add leading 0 to minutes if necessary

  // Return both the formatted date and the getBookingTime method
  return {
    getFormattedDate: `${dayOfWeek} ${dayWithSuffix} ${month} ${year}`,
    getFormattedTime: `${hours}:${minutes} ${ampm}`,
  };
}
