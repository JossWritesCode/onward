// Runs before every unit test file.
//
// A zone behind UTC, so date code that slips into UTC by accident shows up as
// a day early here, the same way it would for anyone in the Americas.
process.env.TZ = 'America/Toronto';
