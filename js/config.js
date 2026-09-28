/* ReDrop configuration.
   Everything the site needs to know about the Google Form and Sheet lives here,
   so the team can swap links without touching the rest of the code. */
window.REDROP = {
  formUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSdt7gEwifZoqTnd7J8OERAvghaiePeS0dAzs3LOEYHCsidEGw/viewform",
  sheetUrl:
    "https://docs.google.com/spreadsheets/d/15qCB06wdptLYfQGpKLxmc1UjI7Hvbhj6TJtiWeb2cFw/edit?usp=drivesdk",
  repoUrl: "https://github.com/onedhyey/ReDrop",
  sheetId: "15qCB06wdptLYfQGpKLxmc1UjI7Hvbhj6TJtiWeb2cFw",

  // Tab ids (the "gid" in the sheet URL). The sheet must stay shared as
  // "Anyone with the link can view" for the site to read it.
  tabs: {
    leaderboard: "1853131906", // Rank | Name | Daily Water
    calculation: "737006610", // Name | Flush | Shower | Brush | Washing | Other | Total
    responses: "801067380", // raw Google Form responses
  },

  // Planning norm for Indian cities: 135 litres per person per day (CPHEEO manual).
  normLitres: 135,

  // Litre values used by the Calculation sheet. The calculator on the site
  // uses the same numbers so its estimate matches the leaderboard.
  rates: {
    flush: { "1-2": 7.5, "3-4": 17.5, "5-6": 27.5, "7+": 35 },
    shower: { "Under 5 minutes": 25, "5-10 minutes": 75, "10-15 minutes": 125, "15+ minutes": 170 },
    brush: { No: 1.5, Sometimes: 3, "Yes, daily": 6 },
    washing: { Daily: 5.7, "2-3 times a week": 2.5, "once a week": 0.6, "Less often": 0.3 },
    other: { Student: 12, Homemaker: 20, "Office Worker": 15, Retired: 15 },
  },
};

/* Last known copy of the sheet, used only when Google Sheets can't be reached
   (offline, blocked network). The live sheet always wins when it loads. */
window.REDROP_SNAPSHOT = {
  takenAt: "2026-09-28",
  leaderboard: [
    ["Angel", 113.2], ["Dhyey", 116.6], ["Mantra", 121.7], ["Pal", 121.7], ["Shakti", 121.7],
    ["Rudra", 146.6], ["Krishika", 153.2], ["Me kyu bataau", 161.7], ["Yana", 179.2],
    ["Shimolee", 196.7], ["Prachi Amin", 216.7], ["Romit Gautam", 218.2],
  ],
  calculation: [
    ["Shimolee", 7.5, 170, 1.5, 5.7, 12, 196.7], ["Krishika", 7.5, 125, 3, 5.7, 12, 153.2],
    ["Rudra", 7.5, 125, 1.5, 0.6, 12, 146.6], ["Romit Gautam", 27.5, 170, 3, 5.7, 12, 218.2],
    ["Mantra", 27.5, 75, 1.5, 5.7, 12, 121.7], ["Pal", 27.5, 75, 1.5, 5.7, 12, 121.7],
    ["Me kyu bataau", 17.5, 125, 1.5, 5.7, 12, 161.7], ["Angel", 17.5, 75, 3, 5.7, 12, 113.2],
    ["Dhyey", 27.5, 75, 1.5, 0.6, 12, 116.6], ["Yana", 35, 125, 1.5, 5.7, 12, 179.2],
    ["Shakti", 27.5, 75, 1.5, 5.7, 12, 121.7], ["Prachi Amin", 27.5, 170, 1.5, 5.7, 12, 216.7],
  ],
  // [name, Q1 guess, Q2 biggest use, Q9 consciousness]
  responses: [
    ["Shimolee", "50-100 litres", "Bathing", "Somewhat conscious"],
    ["Krishika", "Less than 50 litres", "Drinking", "Somewhat conscious"],
    ["Rudra", "Less than 50 litres", "Bathing", "Very conscious"],
    ["Romit Gautam", "50-100 litres", "Bathing", "Not very conscious"],
    ["Mantra", "50-100 litres", "Washing Clothes", "Not very conscious"],
    ["Pal", "50-100 litres", "Bathing", "Not very conscious"],
    ["Me kyu bataau", "Less than 50 litres", "Washing Clothes", "Somewhat conscious"],
    ["Angel", "50-100 litres", "Bathing", "Somewhat conscious"],
    ["Dhyey", "Less than 50 litres", "Drinking", "Somewhat conscious"],
    ["Yana", "100-200 litres", "Washing Clothes", "Very conscious"],
    ["Shakti", "50-100 litres", "Washing Clothes", "Somewhat conscious"],
    ["Prachi Amin", "100-200 litres", "Bathing", "Not very conscious"],
  ],
};
