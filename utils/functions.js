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

export function shouldNotify(bookingDate, hoursLeft) {
  // Parse the booking date from the provided string format 'YYYY-MM-DD HH:mm:ss'
  // Assume the provided date is in CEST (UTC+2)
  const isoFormattedBookingDate = convertToISO8601(bookingDate, "+02:00");
  console.log("Formatted booking date:", isoFormattedBookingDate);
  const bookingTime = new Date(isoFormattedBookingDate);
  console.log("Booking time:", bookingTime);

  // Get the current time (which will be in the user's local time zone)
  const currentTime = new Date();
  console.log("Current time:", currentTime);

  // The Date object automatically converts times to UTC for internal calculations
  // Calculate the time difference in hours (normalized to UTC)
  const timeDifferenceInHours = (bookingTime - currentTime) / (1000 * 60 * 60);

  // Return true if the time difference is less than or equal to hoursLeft and greater than 0
  return timeDifferenceInHours <= hoursLeft && timeDifferenceInHours > 0;
}

function convertToISO8601(dateString, offset) {
  // Add 'T' between the date and time parts
  let isoString = dateString.replace(" ", "T");

  // Append the timezone offset (e.g., "+02:00")
  isoString += offset;

  return isoString;
}

export function getBookingLocation(providerDescription) {
  const locationString = providerDescription.toLowerCase();
  if (locationString.l.includes("sliema")) {
    return "https://maps.app.goo.gl/mXbiac8gqXmuLMCb6";
  } else if (locationString.includes("balluta")) {
    return "https://maps.app.goo.gl/6nG1Md58XaF8Tcwr8";
  } else {
    return "no location found";
  }
}
