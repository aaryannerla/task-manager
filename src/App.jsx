import { useState, useEffect } from "react";
import { PieChart, Pie, Cell } from "recharts";

import { db } from "./firebase";

import {
collection,
addDoc,
deleteDoc,
doc,
onSnapshot,
updateDoc
} from "firebase/firestore";

import {
DndContext,
closestCenter
} from "@dnd-kit/core";

import {
SortableContext,
verticalListSortingStrategy,
useSortable,
arrayMove
} from "@dnd-kit/sortable";

import {CSS} from "@dnd-kit/utilities";
const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const getDeadlineStatus = (deadline) => {

if(!deadline) return "later";

const now = new Date();
const due = new Date(deadline);

if(isNaN(due)) return "later";

const diff = due - now;
const oneDay = 24 * 60 * 60 * 1000;

if(diff <= 0) return "overdue";
if(diff < oneDay) return "today";
if(diff < oneDay * 2) return "tomorrow";
if(diff < oneDay * 7) return "soon";

return "later";

};

function SortableItem({task, toggleTask, deleteTask, editMode}) {

const {
attributes,
listeners,
setNodeRef,
transform,
transition
} = useSortable({id: task.id});

const style = {
transform: CSS.Transform.toString(transform),
transition
};

const status = getDeadlineStatus(task.deadline);

const statusColor = {
overdue: "text-red-600",
today: "text-red-500",
tomorrow: "text-orange-500",
soon: "text-yellow-500",
later: "text-green-500"
};

return(

<div
ref={setNodeRef}
style={style}
{...attributes}
className="border rounded p-3 mb-3 cursor-move bg-white"
>

<div className="flex items-center gap-3 flex-wrap">

<span
{...listeners}
className="cursor-grab text-gray-400"
>
⋮⋮
</span>

<input
type="checkbox"
checked={task.completed}
onChange={()=>toggleTask(task)}
/>

<span className={
task.completed
?"line-through text-gray-400"
:""
}>
{task.title}
</span>

{editMode &&(

<button
onClick={()=>deleteTask(task)}
className="text-red-500 text-xs ml-2"
>
Delete
</button>

)}

</div>

<div className="text-xs text-gray-500 mt-2">
<span className={statusColor[status]}>
Deadline: {task.deadline ? new Date(task.deadline).toLocaleString() : "No deadline"}
</span>
</div>
<div className={`text-xs ${statusColor[status]}`}>

{status === "overdue" && "⚠ Overdue"}
{status === "today" && "🔴 Due Today"}
{status === "tomorrow" && "🟠 Due Tomorrow"}
{status === "soon" && "🟡 Due Soon"}
{status === "later" && "🟢 Later"}

</div>
</div>

);

}

function App(){

const [editMode,setEditMode] = useState(false);
const [progressMode,setProgressMode] = useState("weekly");
const [tasks,setTasks] = useState([]);
const [habits,setHabits] = useState([]);
const [taskTitle,setTaskTitle] = useState("");
const [deadline,setDeadline] = useState("");

/* LOAD TASKS FROM FIREBASE */

useEffect(()=>{

const unsubscribe = onSnapshot(
collection(db,"tasks"),
(snapshot)=>{

const data = snapshot.docs.map(doc=>({
id:doc.id,
...doc.data()
}));

setTasks(data);

});

return ()=>unsubscribe();

},[]);

/* LOAD HABITS FROM FIREBASE */

useEffect(()=>{

const unsubscribe = onSnapshot(
collection(db,"habits"),
(snapshot)=>{

const data = snapshot.docs.map(doc=>({
id:doc.id,
...doc.data()
}));

setHabits(data);

});

return ()=>unsubscribe();

},[]);

/* ADD TASK */

const addTask = async(title)=>{

const newTask={
title,
deadline: deadline || new Date().toISOString(),
completed:false,
order: Date.now()
};

await addDoc(collection(db,"tasks"),newTask);

};
/* TOGGLE TASK */

const toggleTask = async(task)=>{

await updateDoc(
doc(db,"tasks",task.id),
{
completed: !task.completed
}
);

};

/* DELETE TASK */

const deleteTask = async(task)=>{

await deleteDoc(doc(db,"tasks",task.id));

};

/* TOGGLE HABIT */

const toggleHabit = async(habit,day)=>{

const updatedDays = {
...habit.days,
[day]: !habit.days[day]
};

await updateDoc(
doc(db,"habits",habit.id),
{
days: updatedDays
}
);

};

/* TODAY */

const todayIndex=(new Date().getDay()+6)%7;
const today=days[todayIndex];

/* PROGRESS CALCULATION */

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

const todayAdditionalCompleted=
tasks.filter(t=>t.completed).length;

const dailyCompleted=
todayAdditionalCompleted+todayHabitCompleted;

const dailyTotal=
tasks.length+habits.length;

const dailyData=[
{name:"Done",value:dailyCompleted},
{name:"Remaining",value:dailyTotal-dailyCompleted}
];

const chartData =
progressMode==="weekly"
? weeklyData
: dailyData;

const sortedTasks = [...tasks].sort(
(a,b)=>a.order-b.order
);

const COLORS=["#22c55e","#e5e7eb"];

const handleDragEnd = async(event)=>{

const {active,over} = event;

if(!over || active.id===over.id) return;

const oldIndex = sortedTasks.findIndex(t=>t.id===active.id);
const newIndex = sortedTasks.findIndex(t=>t.id===over.id);

const newOrder = arrayMove(sortedTasks,oldIndex,newIndex);

for(let i=0;i<newOrder.length;i++){

await updateDoc(
doc(db,"tasks",newOrder[i].id),
{order:i}
);

}

};


return(

<div className="min-h-screen bg-gray-100 p-3 md:p-6">

<div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[85vh]">

{/* ADDITIONAL TASKS */}

<div className="bg-white rounded-xl shadow p-4 md:overflow-y-auto md:h-full">

<div className="flex justify-between mb-4">

<h2 className="text-lg font-semibold">
Additional Tasks
</h2>

<button
onClick={()=>setEditMode(!editMode)}
className="text-sm bg-gray-200 px-3 py-1 rounded"
>
{editMode ? "Done" : "Edit"}
</button>

</div>

{editMode &&(

<div className="flex flex-col gap-2 mb-3">

<input
type="text"
placeholder="Task title..."
className="border p-2 rounded"
value={taskTitle}
onChange={(e)=>setTaskTitle(e.target.value)}
/>

<input
type="datetime-local"
className="border p-2 rounded"
value={deadline}
onChange={(e)=>setDeadline(e.target.value)}
/>

<button
onClick={()=>{

if(!taskTitle) return;

addTask(taskTitle);

setTaskTitle("");
setDeadline("");

}}
className="bg-blue-500 text-white p-2 rounded"
>
Add Task
</button>

</div>

)}

<DndContext
collisionDetection={closestCenter}
onDragEnd={handleDragEnd}
>

<SortableContext
items={sortedTasks.map(t=>t.id)}
strategy={verticalListSortingStrategy}
>

{sortedTasks.map(task => (

<SortableItem
key={task.id}
task={task}
toggleTask={toggleTask}
deleteTask={deleteTask}
editMode={editMode}
/>

))}

</SortableContext>

</DndContext></div>

{/* RIGHT SIDE */}

<div className="grid grid-rows-[auto_1fr] gap-6 h-full">

{/* PROGRESS */}

<div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">

<h2 className="font-semibold mb-2">
Progress
</h2>

<div className="flex gap-2 mb-3">

<button
onClick={()=>setProgressMode("weekly")}
className={
"px-3 py-1 text-xs rounded "+
(progressMode==="weekly"
?"bg-blue-500 text-white"
:"bg-gray-200")
}
>
Weekly
</button>

<button
onClick={()=>setProgressMode("daily")}
className={
"px-3 py-1 text-xs rounded "+
(progressMode==="daily"
?"bg-blue-500 text-white"
:"bg-gray-200")
}
>
Today
</button>

</div>

<div className="relative">

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

<div className="absolute inset-0 flex items-center justify-center text-xl font-semibold">

{total === 0
? "0%"
: Math.round((completed / total) * 100) + "%"}

</div>

</div>

</div>

{/* HABIT GRID */}

<div className="bg-white rounded-xl shadow p-4 overflow-y-auto h-full">

<h2 className="font-semibold mb-3">
Fixed Tasks
</h2>

<div className="grid grid-cols-8 gap-2 text-xs md:text-sm mb-3 items-center">
  
<div></div>

{days.map(day=>(
<div
key={day}
className={
"text-center "+
(day===today?"text-blue-600":"")
}
>
{day}
</div>
))}

</div>

{habits.map((habit)=>(
<div
key={habit.id}
className="grid grid-cols-8 gap-2 items-center mb-3">

<div className="text-sm pr-2 truncate">
{habit.name}
</div>

{days.map(day=>(

<div
key={day}
onClick={()=>toggleHabit(habit,day)}
className={
"w-7 h-7 rounded cursor-pointer flex items-center justify-center " +
(habit.days?.[day]
? "bg-green-500 "
: "bg-gray-300 ") +
(day === today
? "ring-2 ring-blue-400"
: "")
}
/>

))}

</div>
))}

</div>

</div>

</div>

{/* FLOATING MOBILE BUTTON */}



</div>

);

}

export default App;