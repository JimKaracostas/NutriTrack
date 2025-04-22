import React, { useState, useEffect } from 'react';
import { Calculator, PlusCircle, Home, Settings, X } from 'lucide-react';

// Define types for user and food
type User = {
  name: string;
  age: number;
  gender: "male" | "female";
  weight: number;
  height: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "veryActive";
  goal: "lose" | "maintain" | "gain";
};

type Food = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
};

// Local Storage Keys
const USER_STORAGE_KEY = 'nutritrack-user';
const FOODS_STORAGE_KEY = 'nutritrack-foods';

export default function CalorieTrackerApp() {
  // States for user information with persistence
  const [user, setUser] = useState<User>(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : {
      name: "User",
      age: 30,
      gender: "female",
      weight: 70, // kg
      height: 170, // cm
      activityLevel: "moderate",
      goal: "maintain",
    };
  });

  // Current date for food tracking
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // States for food tracking with persistence
  const [allFoods, setAllFoods] = useState<Food[]>(() => {
    const storedFoods = localStorage.getItem(FOODS_STORAGE_KEY);
    return storedFoods ? JSON.parse(storedFoods) : [];
  });

  // Filter foods for current date
  const foods = allFoods.filter(food => food.date === currentDate);

  const [newFood, setNewFood] = useState<Partial<Food>>({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  const [activeTab, setActiveTab] = useState<"home" | "add" | "metrics" | "settings">("home");

  // Daily nutrition summary
  const [dailySummary, setDailySummary] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  // Goal calculations
  const [nutritionGoals, setNutritionGoals] = useState({
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 55,
  });

  // Save user data when it changes
  useEffect(() => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }, [user]);

  // Save food data when it changes
  useEffect(() => {
    localStorage.setItem(FOODS_STORAGE_KEY, JSON.stringify(allFoods));
  }, [allFoods]);

  // Calculate BMR using Mifflin-St Jeor Equation
  const calculateBMR = (): number => {
    if (user.gender === "female") {
      return Math.round(10 * user.weight + 6.25 * user.height - 5 * user.age - 161);
    } else {
      return Math.round(10 * user.weight + 6.25 * user.height - 5 * user.age + 5);
    }
  };

  // Calculate TDEE (Total Daily Energy Expenditure)
  const calculateTDEE = (): number => {
    const bmr = calculateBMR();
    const activityMultipliers: Record<User["activityLevel"], number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };
    return Math.round(bmr * activityMultipliers[user.activityLevel]);
  };

  // Calculate goal-based calorie needs
  const calculateCalorieGoal = (): number => {
    const tdee = calculateTDEE();
    const goalAdjustments: Record<User["goal"], number> = {
      lose: tdee - 500,
      maintain: tdee,
      gain: tdee + 500,
    };
    return goalAdjustments[user.goal];
  };

  // Update nutrition goals based on user data
  useEffect(() => {
    const calorieGoal = calculateCalorieGoal();

    // Calculate macronutrient ratios (standard distribution)
    const proteinPerKg = user.goal === "gain" ? 2.2 : user.goal === "lose" ? 2.0 : 1.6;
    const proteinGoal = Math.round(user.weight * proteinPerKg);
    const proteinCalories = proteinGoal * 4;

    const fatRatio = 0.25; // 25% of calories from fat
    const fatCalories = calorieGoal * fatRatio;
    const fatGoal = Math.round(fatCalories / 9);

    const remainingCalories = calorieGoal - proteinCalories - fatCalories;
    const carbGoal = Math.round(remainingCalories / 4);

    setNutritionGoals({
      calories: calorieGoal,
      protein: proteinGoal,
      carbs: carbGoal,
      fat: fatGoal,
    });
  }, [user]);

  // Update daily summary whenever foods change
  useEffect(() => {
    const summary = foods.reduce(
      (total, food) => ({
        calories: total.calories + food.calories,
        protein: total.protein + food.protein,
        carbs: total.carbs + food.carbs,
        fat: total.fat + food.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    setDailySummary(summary);
  }, [foods, currentDate]);

  // Navigate dates
  const changeDate = (offset: number) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + offset);
    setCurrentDate(date.toISOString().split('T')[0]);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Add a new food item
  const handleAddFood = (): void => {
    if (newFood.name && newFood.calories) {
      const foodItem: Food = {
        id: Date.now().toString(),
        name: newFood.name,
        calories: newFood.calories || 0,
        protein: newFood.protein || 0,
        carbs: newFood.carbs || 0,
        fat: newFood.fat || 0,
        date: currentDate,
      };

      const updatedFoods = [...allFoods, foodItem];
      setAllFoods(updatedFoods);

      // Reset form
      setNewFood({ name: "", calories: 0, protein: 0, carbs: 0, fat: 0 });

      // If on Add tab, switch to Home to show the added food
      if (activeTab === "add") {
        setActiveTab("home");
      }
    }
  };

  // Remove a food item
  const handleRemoveFood = (id: string): void => {
    setAllFoods(allFoods.filter(food => food.id !== id));
  };

  // Update profile
  const handleUpdateProfile = (field: keyof User, value: any): void => {
    setUser({
      ...user,
      [field]: value,
    });
  };

  // Calculate remaining calories
  const remainingCalories = nutritionGoals.calories - dailySummary.calories;
  const caloriePercentage = Math.min(100, (dailySummary.calories / nutritionGoals.calories) * 100);

  // Calculate progress percentages for macros
  const proteinPercentage = Math.min(100, (dailySummary.protein / nutritionGoals.protein) * 100);
  const carbsPercentage = Math.min(100, (dailySummary.carbs / nutritionGoals.carbs) * 100);
  const fatPercentage = Math.min(100, (dailySummary.fat / nutritionGoals.fat) * 100);

  // Generate advice based on current intake and goals
  const generateAdvice = (): string[] => {
    const advice: string[] = [];

    if (remainingCalories < -200) {
      advice.push("You're over your calorie goal. Consider lighter meals for the rest of the day.");
    } else if (remainingCalories > nutritionGoals.calories * 0.5) {
      advice.push("You're significantly under your calorie goal. Make sure you're eating enough.");
    }

    if (dailySummary.protein < nutritionGoals.protein * 0.6 && dailySummary.calories > nutritionGoals.calories * 0.5) {
      advice.push("Try to include more protein-rich foods in your next meals.");
    }

    if (dailySummary.fat > nutritionGoals.fat) {
      advice.push("You've reached your fat intake for today. Focus on lean proteins and complex carbs.");
    }

    return advice.length > 0 ? advice : ["You're on track with your nutrition goals today!"];
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto">
      {/* Header */}
      <header className="bg-black text-white p-4">
        <h1 className="text-xl font-bold">NutriTrack</h1>
        <p className="">Hello, {user.name} </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === "home" && (
          <div>
            {/* Date Navigation */}
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={() => changeDate(-1)}
                className="p-2 bg-gray-100 rounded"
              >
                &lt;
              </button>
              <h2 className="font-semibold">{formatDate(currentDate)}</h2>
              <button 
                onClick={() => changeDate(1)}
                className="p-2 bg-gray-100 rounded"
              >
                &gt;
              </button>
            </div>

            {/* Daily Summary */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold">Daily Summary</h2>
              </div>

              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span>Calories</span>
                  <span>{dailySummary.calories} / {nutritionGoals.calories}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${remainingCalories < 0 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${caloriePercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Protein</div>
                  <div className="font-semibold">{dailySummary.protein}g</div>
                  <div className="text-xs text-gray-500">of {nutritionGoals.protein}g</div>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Carbs</div>
                  <div className="font-semibold">{dailySummary.carbs}g</div>
                  <div className="text-xs text-gray-500">of {nutritionGoals.carbs}g</div>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Fat</div>
                  <div className="font-semibold">{dailySummary.fat}g</div>
                  <div className="text-xs text-gray-500">of {nutritionGoals.fat}g</div>
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                <h3 className="font-semibold mb-1">Today's Advice</h3>
                <ul className="text-sm">
                  {generateAdvice().map((advice, index) => (
                    <li key={index} className="mb-1">{advice}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Today's Food */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold">Food Log</h2>
                <button
                  onClick={() => setActiveTab("add")}
                  className="text-sm bg-black text-white px-3 py-1 rounded"
                >
                  Add Food
                </button>
              </div>
              
              {foods.length === 0 ? (
                <p className="text-gray-500 text-sm">No foods logged for {formatDate(currentDate)}.</p>
              ) : (
                <ul className="divide-y">
                  {foods.map(food => (
                    <li key={food.id} className="py-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{food.name}</span>
                        <div className="flex items-center">
                          <span className="font-semibold mr-2">{food.calories} cal</span>
                          <button 
                            onClick={() => handleRemoveFood(food.id)}
                            className="text-red-500"
                            aria-label="Remove food"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === "add" && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-bold mb-4">Add Food</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  placeholder="e.g. Chicken Breast"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={newFood.calories}
                  onChange={(e) => setNewFood({ ...newFood, calories: Number(e.target.value) })}
                  placeholder="e.g. 165"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={newFood.protein}
                    onChange={(e) => setNewFood({ ...newFood, protein: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={newFood.carbs}
                    onChange={(e) => setNewFood({ ...newFood, carbs: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={newFood.fat}
                    onChange={(e) => setNewFood({ ...newFood, fat: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded font-medium"
                  onClick={() => setActiveTab("home")}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-black text-white py-2 rounded font-medium"
                  onClick={handleAddFood}
                >
                  Add Food
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "metrics" && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-bold mb-4">Nutrition Metrics</h2>
            
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-3">Daily Macronutrient Breakdown</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Protein ({Math.round((dailySummary.protein * 4 / (nutritionGoals.calories || 1)) * 100)}%)</span>
                    <span>{dailySummary.protein}g / {nutritionGoals.protein}g</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${proteinPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Carbs ({Math.round((dailySummary.carbs * 4 / (nutritionGoals.calories || 1)) * 100)}%)</span>
                    <span>{dailySummary.carbs}g / {nutritionGoals.carbs}g</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${carbsPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Fat ({Math.round((dailySummary.fat * 9 / (nutritionGoals.calories || 1)) * 100)}%)</span>
                    <span>{dailySummary.fat}g / {nutritionGoals.fat}g</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-yellow-500"
                      style={{ width: `${fatPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-md font-semibold mb-3">Your Energy Needs</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">BMR:</span>
                  <span className="font-medium">{calculateBMR()} calories</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TDEE:</span>
                  <span className="font-medium">{calculateTDEE()} calories</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Goal:</span>
                  <span className="font-medium">{nutritionGoals.calories} calories</span>
                </div>
              </div>
              
              <div className="mt-4 bg-blue-50 p-3 rounded text-sm">
                <p className="mb-2">
                  <span className="font-semibold">BMR</span> is the calories your body needs at rest.
                </p>
                <p>
                  <span className="font-semibold">TDEE</span> includes your activity level for daily needs.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-md font-semibold mb-3">Daily Progress</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-black bg-blue-200">
                      Progress
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-black">
                      {Math.round(caloriePercentage)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-6 mb-4 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${caloriePercentage}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                      remainingCalories < 0 ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                  >
                    {dailySummary.calories} / {nutritionGoals.calories}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-bold mb-4">Profile Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={user.name}
                  onChange={(e) => handleUpdateProfile('name', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={user.age}
                  onChange={(e) => handleUpdateProfile('age', Number(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  className="w-full p-2 border rounded"
                  value={user.gender}
                  onChange={(e) => handleUpdateProfile('gender', e.target.value)}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={user.weight}
                  onChange={(e) => handleUpdateProfile('weight', Number(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={user.height}
                  onChange={(e) => handleUpdateProfile('height', Number(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                <select
                  className="w-full p-2 border rounded"
                  value={user.activityLevel}
                  onChange={(e) => handleUpdateProfile('activityLevel', e.target.value)}
                >
                  <option value="sedentary">Sedentary (little or no exercise)</option>
                  <option value="light">Light (light exercise 1-3 days/week)</option>
                  <option value="moderate">Moderate (exercise 3-5 days/week)</option>
                  <option value="active">Active (hard exercise 6-7 days/week)</option>
                  <option value="veryActive">Very Active (very hard exercise & physical job)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
                <select
                  className="w-full p-2 border rounded"
                  value={user.goal}
                  onChange={(e) => handleUpdateProfile('goal', e.target.value)}
                >
                  <option value="lose">Lose weight</option>
                  <option value="maintain">Maintain weight</option>
                  <option value="gain">Gain weight</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t flex justify-around py-2">
        <button
          className={`flex flex-col items-center p-2 ${activeTab === "home" ? "text-black" : "text-gray-500"}`}
          onClick={() => setActiveTab("home")}
        >
          <Home size={20} />
          <span className="text-xs mt-1">Home</span>
        </button>
        <button
          className={`flex flex-col items-center p-2 ${activeTab === "add" ? "text-black" : "text-gray-500"}`}
          onClick={() => setActiveTab("add")}
        >
          <PlusCircle size={20} />
          <span className="text-xs mt-1">Add</span>
        </button>
        <button
          className={`flex flex-col items-center p-2 ${activeTab === "metrics" ? "text-black" : "text-gray-500"}`}
          onClick={() => setActiveTab("metrics")}
        >
          <Calculator size={20} />
          <span className="text-xs mt-1">Metrics</span>
        </button>
        <button
          className={`flex flex-col items-center p-2 ${activeTab === "settings" ? "text-black" : "text-gray-500"}`}
          onClick={() => setActiveTab("settings")}
        >
          <Settings size={20} />
          <span className="text-xs mt-1">Settings</span>
        </button>
      </nav>
    </div>
  );
}