import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, Settings, Info } from 'lucide-react';
import Confetti from 'react-confetti';
import './App.css';

const LevelUpAnimation = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="absolute left-full ml-2 animate-level-up">
      <span className="text-2xl font-bold text-green-500">+1</span>
    </div>
  );
};

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
  const [showInfo, setShowInfo] = useState(false);
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
  const [isConfettiActive, setIsConfettiActive] = useState(false);

  useEffect(() => {
    const lastUpdateTime = localStorage.getItem('lastUpdateTime');
    if (lastUpdateTime) {
      const now = new Date().getTime();
      const timeDiff = now - Number(lastUpdateTime);
      const daysPassed = timeDiff / (1000 * 60 * 60 * 24);
      const expensePerDay = monthlyExpense / 30;
      const offlineExpense = daysPassed * expensePerDay;
      setBalance(prevBalance => Math.max(0, prevBalance - offlineExpense));
    }
    localStorage.setItem('lastUpdateTime', new Date().getTime().toString());
  }, [monthlyExpense]);

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

    let newTimeLeft;
    if (now >= resetDate && now < workEndTime) {
      // 在工作時間內
      newTimeLeft = Math.max(0, Math.floor((workEndTime - now) / 1000));
    } else {
      // 在工作時間外
      newTimeLeft = 0;
    }

    setTimeLeft(newTimeLeft);

    setBalance(prevBalance => {
      const newBalance = Math.max(0, prevBalance - monthlyExpense / (30 * 24 * 60 * 60));
      return Number(newBalance.toFixed(2));
    });

    setTasks(prevTasks => prevTasks.map(task => ({
      ...task,
      remainingTime: Math.max(0, new Date(task.deadline) - now)
    })));
    localStorage.setItem('lastUpdateTime', now.getTime().toString());
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
    setShowLevelUpAnimation(true);
    setIsConfettiActive(true);
  };

  const handleConfettiComplete = useCallback(() => {
    setIsConfettiActive(false);
  }, []);

  const handleAnimationComplete = () => {
    setShowLevelUpAnimation(false);
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

  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-sky-100 p-4">
      {isConfettiActive && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          gravity={0.04}
          tweenDuration={6000}
          onConfettiComplete={handleConfettiComplete}
        />
      )}
      <div className="bg-slate-50 rounded-lg shadow-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold dashboard-title">人生儀表板</h1>
          <button onClick={() => { setShowSettings(!showSettings); setShowInfo(false); }} className="text-gray-500">
            <Settings size={24} />
          </button>
        </div>
        <div className="dashboard-content">
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
            <div className="flex justify-end mt-4">
              <button onClick={toggleInfo} className="text-gray-500">
                <Info size={20} />
              </button>
            </div>
            {showInfo && (
              <div className="mt-4 text-xs text-gray-600">
                <p>《人生儀表板》為你的人生online加上UI，時刻提醒你打怪練功</p>
                <p>本程式藉由把你的可用資源以及每天剩餘精力可視化，來提醒你不要一直耍廢</p>
                <p>本程式不會收集你的資訊，你的資訊都存在本地，也因此無法跨裝置同步資訊</p>
                <p>更新每月支出後，存款餘額就會開始每秒自動更新</p>
                <p>若要更新存款餘額，先把每月支出暫時設為0</p>
                <p>本程式使用Claude 3.5 Sonnet完成，<a href="https://github.com/awei1127/life-dashboard" className="text-blue-500 hover:underline">程式碼</a>可自由變更使用，歡迎高手再創造</p>
              </div>
            )}
          </div>
        ) : (
          <>
              <div className="mb-4 relative">
                <p className="text-lg font-semibold">等級: {level}</p>
                {showLevelUpAnimation && <LevelUpAnimation onComplete={handleAnimationComplete} />}
            </div>
            <div className="mb-4">
              <p className="text-lg font-semibold">生命值: ${balance.toFixed(2)}</p>
            </div>
            <div className="mb-4">
              <p className="text-lg font-semibold">精力: {formatTime(timeLeft)}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${Math.min(100, (timeLeft / (workHours * 60 * 60)) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">任務清單</h2>
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
                    placeholder="任務名稱"
                    className="flex-grow mr-2 p-2 border rounded"
                  />
                  <input
                    type="datetime-local"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="p-2 border rounded"
                  />
                </div>
                <button onClick={handleAddTask} className="self-end bg-blue-500 text-white p-2 rounded">新增</button>
              </div>
            </div>
          </>
          )}
        </div>
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
