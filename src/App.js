import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, Settings } from 'lucide-react';

const Dashboard = () => {
  const [balance, setBalance] = useState(() => Number(localStorage.getItem('balance')) || 10000);
  const [level, setLevel] = useState(() => Number(localStorage.getItem('level')) || 1);
  const [timeLeft, setTimeLeft] = useState(() => Number(localStorage.getItem('timeLeft')) || 8 * 60 * 60);
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('tasks')) || []);
  const [newTask, setNewTask] = useState({ name: '', deadline: '' });
  const [monthlyExpense, setMonthlyExpense] = useState(() => Number(localStorage.getItem('monthlyExpense')) || 3000);
  const [workHours, setWorkHours] = useState(() => Number(localStorage.getItem('workHours')) || 8);
  const [resetTime, setResetTime] = useState(() => localStorage.getItem('resetTime') || '09:00');
  const [showSettings, setShowSettings] = useState(false);

  const updateTimeAndTasks = useCallback(() => {
    const now = new Date();
    const [resetHour, resetMinute] = resetTime.split(':').map(Number);
    
    // 計算今天的重置時間
    let resetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), resetHour, resetMinute);
    
    // 如果當前時間早於今天的重置時間，則使用昨天的重置時間
    if (now < resetDate) {
      resetDate = new Date(resetDate.getTime() - 24 * 60 * 60 * 1000);
    }
    
    const workEndTime = new Date(resetDate.getTime() + workHours * 60 * 60 * 1000);

    console.log('Current time:', now.toLocaleTimeString());
    console.log('Reset time:', resetDate.toLocaleTimeString());
    console.log('Work end time:', workEndTime.toLocaleTimeString());

    let newTimeLeft;
    if (now >= resetDate && now < workEndTime) {
      // 在工作時間內
      newTimeLeft = Math.max(0, Math.floor((workEndTime - now) / 1000));
    } else {
      // 在工作時間外
      newTimeLeft = 0;
    }

    setTimeLeft(newTimeLeft);
    console.log('Time left updated:', newTimeLeft);

    setBalance(prevBalance => {
      const newBalance = Math.max(0, prevBalance - monthlyExpense / (30 * 24 * 60 * 60));
      return Number(newBalance.toFixed(2));
    });

    setTasks(prevTasks => prevTasks.map(task => ({
      ...task,
      remainingTime: Math.max(0, new Date(task.deadline) - now)
    })));
  }, [resetTime, workHours, monthlyExpense]);

  useEffect(() => {
    updateTimeAndTasks(); // 立即執行一次
    const timer = setInterval(updateTimeAndTasks, 1000);
    return () => clearInterval(timer);
  }, [updateTimeAndTasks]);

  useEffect(() => {
    localStorage.setItem('balance', balance.toString());
    localStorage.setItem('level', level.toString());
    localStorage.setItem('timeLeft', timeLeft.toString());
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('monthlyExpense', monthlyExpense.toString());
    localStorage.setItem('workHours', workHours.toString());
    localStorage.setItem('resetTime', resetTime);
  }, [balance, level, timeLeft, tasks, monthlyExpense, workHours, resetTime]);

  const handleAddTask = () => {
    if (newTask.name && newTask.deadline) {
      const deadline = new Date(newTask.deadline);
      setTasks([...tasks, { ...newTask, id: Date.now(), remainingTime: deadline - new Date() }]);
      setNewTask({ name: '', deadline: '' });
    }
  };

  const handleCompleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
    setLevel(prevLevel => prevLevel + 1);
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatRemainingTime = (ms) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (ms <= 0) return "已過期";
    if (days > 0) return `${days}天`;
    if (hours > 0) return `${hours}小時`;
    return `${minutes}分鐘`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Life Dashboard</h1>
          <button onClick={() => setShowSettings(!showSettings)} className="text-gray-500">
            <Settings size={24} />
          </button>
        </div>

        {showSettings ? (
          <div className="mb-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">存款餘額</label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">每月支出</label>
              <input
                type="number"
                value={monthlyExpense}
                onChange={(e) => setMonthlyExpense(Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">每天工作時長 (小時)</label>
              <input
                type="number"
                value={workHours}
                onChange={(e) => setWorkHours(Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工作開始時間</label>
              <input
                type="time"
                value={resetTime}
                onChange={(e) => setResetTime(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-lg font-semibold">Level: {level}</p>
            </div>
            <div className="mb-4">
              <p className="text-lg font-semibold">Balance: ${balance.toFixed(2)}</p>
            </div>
            <div className="mb-4">
              <p className="text-lg font-semibold">Time Left: {formatTime(timeLeft)}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${Math.min(100, (timeLeft / (workHours * 60 * 60)) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Tasks</h2>
              <ul>
                {tasks.map(task => (
                  <li key={task.id} className="flex justify-between items-center mb-2">
                    <span>{task.name} - {formatRemainingTime(task.remainingTime)}</span>
                    <div>
                      {task.remainingTime > 0 && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="mr-2 text-green-500"
                        >
                          <CheckCircle size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-500"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col mt-2">
                <div className="flex mb-2">
                  <input
                    type="text"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    placeholder="Task name"
                    className="flex-grow mr-2 p-2 border rounded"
                  />
                  <input
                    type="datetime-local"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="p-2 border rounded"
                  />
                </div>
                <button onClick={handleAddTask} className="self-end bg-blue-500 text-white p-2 rounded">Add</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}

export default App;
