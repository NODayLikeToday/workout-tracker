const WORKOUT_DATA = {
  push: {
    label: "Push",
    subtitle: "Chest · Shoulders · Triceps",
    days: ["Monday", "Friday"],
    color: "#E8500A",
    exercises: [
      "Dumbbell Bench Press",
      "Dumbbell Shoulder Press",
      "Lateral Raises",
      "Dumbbell Flyes",
      "Overhead Tricep Extension",
      "Tricep Kickbacks",
      // Friday variations
      "Incline Dumbbell Press",
      "Arnold Press",
      "Push-ups",
      "Skull Crushers",
    ]
  },
  pull: {
    label: "Pull",
    subtitle: "Back · Biceps · Rear Delts",
    days: ["Tuesday", "Saturday"],
    color: "#1A6B3C",
    exercises: [
      "Dumbbell Rows",
      "Dumbbell Pullover",
      "Rear Delt Flyes",
      "Dumbbell Curl",
      "Hammer Curl",
      // Saturday variations
      "Incline Dumbbell Row",
      "Dumbbell Shrugs",
      "Face Pulls",
      "Concentration Curl",
      "Reverse Curl",
    ]
  },
  legs: {
    label: "Legs + Core",
    subtitle: "Quads · Hamstrings · Calves · Abs",
    days: ["Thursday"],
    color: "#2563A8",
    exercises: [
      "Goblet Squat",
      "Romanian Deadlift",
      "Reverse Lunges",
      "Calf Raises",
      "Plank",
      "Crunches",
      "Leg Raises",
      "Bicycle Crunches",
      "Russian Twists",
    ]
  },
  rest: {
    label: "Rest",
    subtitle: "Recovery day",
    days: ["Wednesday", "Sunday"],
    color: "#6B7280",
    exercises: []
  }
};

// Suggested starting weights based on Nick's profile
const DEFAULT_WEIGHTS = {
  "Dumbbell Bench Press": 80,
  "Dumbbell Shoulder Press": 25,
  "Dumbbell Curl": 20,
  "Hammer Curl": 20,
  "Goblet Squat": 40,
  "Romanian Deadlift": 40,
  "Reverse Lunges": 20,
};

const EFFORT_LEVELS = [
  { value: "medium", label: "Medium", icon: "●○○" },
  { value: "medium_high", label: "Medium-High", icon: "●●○" },
  { value: "high", label: "High", icon: "●●●" },
];

// Get day type from day of week
function getDayType(date) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = days[date.getDay()];
  for (const [type, data] of Object.entries(WORKOUT_DATA)) {
    if (data.days.includes(dayName)) return type;
  }
  return "push"; // fallback
}

function getDayName(date) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}
