import { useState, useEffect } from "react";
import { PieChart, Pie, Cell } from "recharts";

const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function App(){

const [editMode,setEditMode] = useState(false);
const [progressMode,setProgressMode] = useState("weekly");

const [tasks,setTasks] = useState(()=>{

const saved = localStorage.getItem("tasks");

return saved ? JSON.parse(saved) : [];

});

const [habits,setHabits] = useState(()=>{

const saved = localStorage.getItem("habits");

return saved ? JSON.parse(saved) : [

{name:"Workout",days:{Mon:false,Tue:false,Wed:false,Thu:false,Fri:false,Sat:false,Sun:false}},
{name:"Study",days:{Mon:false,Tue:false,Wed:false,Thu:false,Fri:false,Sat:false,Sun:false}},
{name:"Reading",days:{Mon:false,Tue:false,Wed:false,Thu:false,Fri:false,Sat:false,Sun:false}},
{name:"Japanese",days:{Mon:false,Tue:false,Wed:false,Thu:false,Fri:false,Sat:false,Sun:false}},
{name:"Meditation",days:{Mon:false,Tue:false,Wed:false,Thu:false,Fri:false,Sat:false,Sun:false}}

];

});

useEffect(()=>{
localStorage.setItem("tasks",JSON.stringify(tasks));
},[tasks]);

useEffect(()=>{
localStorage.setItem("habits",JSON.stringify(habits));
},[habits]);

const toggleTask = (id)=>{
setTasks(tasks.map(t =>
t.id===id ? {...t,completed:!t.completed} : t
));
};

const toggleHabit = (habitIndex,day)=>{

const updated=[...habits];
updated[habitIndex].days[day]=!updated[habitIndex].days[day];
setHabits(updated);

};

const todayIndex=(new Date().getDay()+6)%7;
const today=days[todayIndex];

const totalAdditional=tasks.length;
const completedAdditional=tasks.filter(t=>t.completed).length;

let totalHabitSquares=habits.length*7;
let completedHabitSquares=0;

habits.forEach(h=>{
Object.values(h.days).forEach(v=>{
if(v) completedHabitSquares++;
});
});

const completed=completedAdditional+completedHabitSquares;
const total=totalAdditional+totalHabitSquares;

const weeklyData=[
{name:"Done",value:completed},
{name:"Remaining",value:total-completed}
];

let todayHabitCompleted=0;

habits.forEach(h=>{
if(h.days[today]) todayHabitCompleted++;
});

const todayAdditionalCompleted=tasks.filter(t=>t.completed).length;

const dailyCompleted=todayAdditionalCompleted+todayHabitCompleted;
const dailyTotal=tasks.length+habits.length;

const dailyData=[
{name:"Done",value:dailyCompleted},
{name:"Remaining",value:dailyTotal-dailyCompleted}
];

const chartData = progressMode==="weekly" ? weeklyData : dailyData;

const COLORS=["#22c55e","#e5e7eb"];

const getTimeLeft=(deadline)=>{

const now=new Date();
const end=new Date(deadline);
const diff=end-now;

if(diff<=0) return "Expired";

const hours=Math.floor(diff/(1000*60*60));
const minutes=Math.floor((diff%(1000*60*60))/(1000*60));

if(hours>=24){

const days=Math.floor(hours/24);
return days+" day(s) left";

}

return hours+"h "+minutes+"m left";

};

const upcomingTasks = tasks.filter(task=>{

const now=new Date();
const deadline=new Date(task.deadline);
const diff=deadline-now;

return diff>0 && diff<=24*60*60*1000 && !task.completed;

});

return (

<div className="min-h-screen bg-gray-100 p-3 md:p-6">

{upcomingTasks.length>0 &&(

<div className="bg-yellow-200 border border-yellow-400 text-yellow-800 p-3 mb-4 rounded">

⚠ Task due within 24 hours:

{upcomingTasks.map(task=>(
<div key={task.id}>{task.title}</div>
))}

</div>

)}

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

<div className="bg-white rounded-xl shadow p-4 overflow-auto">

<div className="flex justify-between mb-4">

<h2 className="text-lg font-semibold">Additional Tasks</h2>

<button
onClick={()=>setEditMode(!editMode)}
className="text-sm bg-gray-200 px-3 py-1 rounded"
>
{editMode ? "Done" : "Edit"}
</button>

</div>

{editMode &&(

<input
type="text"
placeholder="New task..."
className="border p-2 w-full mb-3 rounded"
onKeyDown={(e)=>{

if(e.key==="Enter"){

const newTask={
id:Date.now(),
title:e.target.value,
deadline:new Date().toISOString(),
priority:"Medium",
completed:false
};

setTasks([...tasks,newTask]);
e.target.value="";

}

}}
/>

)}

{tasks.map(task=>(

<div key={task.id} className="border rounded p-3 mb-3">

<div className="flex items-center gap-2">

<input
type="checkbox"
checked={task.completed}
onChange={()=>toggleTask(task.id)}
/>

<span className={task.completed ? "line-through text-gray-400":""}>
{task.title}
</span>

{editMode &&(

<button
onClick={()=>setTasks(tasks.filter(t=>t.id!==task.id))}
className="text-red-500 text-xs ml-2"
>
Delete
</button>

)}

</div>

<div className="text-sm mt-2">

<div>Priority: {task.priority}</div>
<div>Deadline: {new Date(task.deadline).toLocaleString()}</div>
<div>Time Left: {getTimeLeft(task.deadline)}</div>

</div>

</div>

))}

</div>

<div className="grid grid-rows-[auto_auto] gap-6">

<div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">

<h2 className="font-semibold mb-2">Progress</h2>

<div className="flex gap-2 mb-3">

<button
onClick={()=>setProgressMode("weekly")}
className={
"px-3 py-1 text-xs rounded "+
(progressMode==="weekly"?"bg-blue-500 text-white":"bg-gray-200")
}
>
Weekly
</button>

<button
onClick={()=>setProgressMode("daily")}
className={
"px-3 py-1 text-xs rounded "+
(progressMode==="daily"?"bg-blue-500 text-white":"bg-gray-200")
}
>
Today
</button>

</div>

<PieChart width={200} height={200}>

<Pie
data={chartData}
cx="50%"
cy="50%"
innerRadius={60}
outerRadius={80}
dataKey="value"
>

{chartData.map((entry,index)=>(
<Cell key={index} fill={COLORS[index]} />
))}

</Pie>

</PieChart>

<div className="mt-2 text-sm">

{progressMode==="weekly"
?`${completed}/${total} completed`
:`${dailyCompleted}/${dailyTotal} completed`
}

</div>

</div>

<div className="bg-white rounded-xl shadow p-4">

<div className="flex justify-between mb-3">
<h2 className="font-semibold">Fixed Tasks</h2>
</div>

<div className="grid grid-cols-8 text-xs md:text-sm mb-2 overflow-x-auto">

<div></div>

{days.map(day=>(
<div
key={day}
className={
"text-center font-medium "+
(day===today?"text-blue-600":"")
}
>
{day}
</div>
))}

</div>

{habits.map((habit,i)=>(

<div key={i} className="grid grid-cols-8 items-center mb-2">

{editMode ? (

<input
value={habit.name}
onChange={(e)=>{

const updated=[...habits];
updated[i].name=e.target.value;
setHabits(updated);

}}
className="border rounded p-1 text-sm"
/>

) : (

<div className="text-sm">{habit.name}</div>

)}

{days.map(day=>(

<div
key={day}
onClick={()=>toggleHabit(i,day)}
className={
"w-7 h-7 md:w-6 md:h-6 rounded cursor-pointer mx-auto "+
(habit.days[day]?"bg-green-500":"bg-gray-300")+
(day===today?" ring-2 ring-blue-400":"")
}
/>

))}

</div>

))}

{editMode &&(

<button
onClick={()=>{

setHabits([
...habits,
{
name:"New Task",
days:{Mon:false,Tue:false,Wed:false,Thu:false,Fri:false,Sat:false,Sun:false}
}
]);

}}
className="mt-3 text-sm bg-blue-500 text-white px-3 py-1 rounded"
>
Add Habit
</button>

)}

</div>

</div>

</div>
<button
onClick={() => setEditMode(true)}
className="fixed bottom-6 right-6 md:hidden bg-blue-500 text-white w-14 h-14 rounded-full text-3xl shadow-lg flex items-center justify-center"
>
+
</button>
</div>

);

}

export default App;