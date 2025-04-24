import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Target,
  Plus,
  Calendar,
  Trash2,
  Edit,
  User,
  CheckCircle,
  Circle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

// Interface voor de todo items
interface Todo {
  id: number;
  title: string;
  description: string;
  assignedTo: number;
  completed: boolean;
  dueDate: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

// Interface voor notities
interface Note {
  id: number;
  title: string;
  content: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

// Interface voor kwartaaldoelstellingen
interface Goal {
  id: number;
  title: string;
  description: string;
  quarter: string;
  year: number;
  status: "planning" | "in-progress" | "completed";
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export default function Werkruimte() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Tab state
  const [activeTab, setActiveTab] = useState("todos");
  
  // Todo form state
  const [todoTitle, setTodoTitle] = useState("");
  const [todoDescription, setTodoDescription] = useState("");
  const [todoDueDate, setTodoDueDate] = useState("");
  const [todoAssignee, setTodoAssignee] = useState<string>("");
  const [todoPriority, setTodoPriority] = useState<"low" | "medium" | "high">("medium");
  
  // Note form state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  
  // Goal form state
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalQuarter, setGoalQuarter] = useState("Q1");
  const [goalYear, setGoalYear] = useState(new Date().getFullYear());
  
  // Dialog states
  const [isAddTodoOpen, setIsAddTodoOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  
  // Fetch users for assignee selection
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    select: (data: any) => data.filter((user: any) => user.role === 'admin')
  });
  
  // Mock data voor demo doeleinden - dit zou later vervangen worden door API calls
  const [todos, setTodos] = useState<Todo[]>([
    {
      id: 1,
      title: "Planning kwartaalmeeting",
      description: "Plan de kwartaal afsluitende meeting voor alle teams",
      assignedTo: 1,
      completed: false,
      dueDate: "2025-05-15",
      priority: "high",
      createdAt: "2025-04-20T10:00:00Z",
      updatedAt: "2025-04-20T10:00:00Z"
    },
    {
      id: 2,
      title: "Nieuwe medewerkers informeren over beloningssysteem",
      description: "Zorg dat alle nieuwe medewerkers een introductie krijgen tot het beloningssysteem",
      assignedTo: 1,
      completed: true,
      dueDate: "2025-04-10",
      priority: "medium",
      createdAt: "2025-04-05T14:30:00Z",
      updatedAt: "2025-04-10T09:15:00Z"
    }
  ]);
  
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      title: "Ideeën voor nieuwe beloningen",
      content: "Tijdens de laatste teammeeting zijn de volgende ideeën voor nieuwe beloningen naar voren gekomen:\n- Sportschool abonnement\n- Extra vrije dag\n- Koffiebonnen\n- Workshop naar keuze",
      createdBy: 1,
      createdAt: "2025-04-15T13:00:00Z",
      updatedAt: "2025-04-15T13:00:00Z"
    }
  ]);
  
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: 1,
      title: "Verbeteren engagement medewerkers",
      description: "Verhoog de participatiegraad in het beloningssysteem tot 80% aan het einde van Q2",
      quarter: "Q2",
      year: 2025,
      status: "in-progress",
      progress: 45,
      createdAt: "2025-04-01T09:00:00Z",
      updatedAt: "2025-04-18T11:30:00Z"
    },
    {
      id: 2,
      title: "Uitbreiden assortiment beloningen",
      description: "Voeg ten minste 10 nieuwe beloningsopties toe aan het systeem voor eind Q2",
      quarter: "Q2",
      year: 2025,
      status: "planning",
      progress: 20,
      createdAt: "2025-04-02T10:15:00Z",
      updatedAt: "2025-04-10T16:45:00Z"
    }
  ]);
  
  // Later zouden deze vervangen worden door echte API mutaties
  const handleAddTodo = () => {
    if (!todoTitle || !todoAssignee || !todoDueDate) return;
    
    const newTodo: Todo = {
      id: todos.length + 1,
      title: todoTitle,
      description: todoDescription,
      assignedTo: parseInt(todoAssignee),
      completed: false,
      dueDate: todoDueDate,
      priority: todoPriority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setTodos([...todos, newTodo]);
    setIsAddTodoOpen(false);
    resetTodoForm();
  };
  
  const handleAddNote = () => {
    if (!noteTitle || !noteContent) return;
    
    const newNote: Note = {
      id: notes.length + 1,
      title: noteTitle,
      content: noteContent,
      createdBy: user?.id || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setNotes([...notes, newNote]);
    setIsAddNoteOpen(false);
    resetNoteForm();
  };
  
  const handleAddGoal = () => {
    if (!goalTitle || !goalDescription) return;
    
    const newGoal: Goal = {
      id: goals.length + 1,
      title: goalTitle,
      description: goalDescription,
      quarter: goalQuarter,
      year: goalYear,
      status: "planning",
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setGoals([...goals, newGoal]);
    setIsAddGoalOpen(false);
    resetGoalForm();
  };
  
  const handleToggleTodo = (id: number) => {
    setTodos(
      todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() } : todo
      )
    );
  };
  
  const handleDeleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };
  
  const handleDeleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id));
  };
  
  const handleUpdateGoalStatus = (id: number, status: "planning" | "in-progress" | "completed") => {
    setGoals(
      goals.map(goal => 
        goal.id === id ? { 
          ...goal, 
          status, 
          progress: status === "completed" ? 100 : goal.progress,
          updatedAt: new Date().toISOString() 
        } : goal
      )
    );
  };
  
  const handleUpdateGoalProgress = (id: number, progress: number) => {
    setGoals(
      goals.map(goal => 
        goal.id === id ? { 
          ...goal, 
          progress: Math.min(100, Math.max(0, progress)),
          status: progress >= 100 ? "completed" : progress > 0 ? "in-progress" : "planning",
          updatedAt: new Date().toISOString() 
        } : goal
      )
    );
  };
  
  const resetTodoForm = () => {
    setTodoTitle("");
    setTodoDescription("");
    setTodoDueDate("");
    setTodoAssignee("");
    setTodoPriority("medium");
  };
  
  const resetNoteForm = () => {
    setNoteTitle("");
    setNoteContent("");
  };
  
  const resetGoalForm = () => {
    setGoalTitle("");
    setGoalDescription("");
    setGoalQuarter("Q1");
    setGoalYear(new Date().getFullYear());
  };
  
  const getUserName = (userId: number) => {
    if (usersLoading) return 'Laden...';
    const user = users?.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Onbekend';
  };
  
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-green-500';
      default: return '';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'planning': return 'text-blue-500';
      case 'in-progress': return 'text-amber-500';
      case 'completed': return 'text-green-500';
      default: return '';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'planning': return <Circle className="h-4 w-4 text-blue-500" />;
      case 'in-progress': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Werkruimte</h1>
        <p className="text-muted-foreground">
          Beheer taken, notities en kwartaaldoelstellingen voor het team
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="todos">
            <ClipboardList className="mr-2 h-4 w-4" />
            Taken
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="mr-2 h-4 w-4" />
            Notities
          </TabsTrigger>
          <TabsTrigger value="goals">
            <Target className="mr-2 h-4 w-4" />
            Doelstellingen
          </TabsTrigger>
        </TabsList>
        
        {/* Todo's Tab */}
        <TabsContent value="todos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Taken</h2>
            <Dialog open={isAddTodoOpen} onOpenChange={setIsAddTodoOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuwe taak
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nieuwe taak toevoegen</DialogTitle>
                  <DialogDescription>
                    Voeg een nieuwe taak toe en wijs deze toe aan een teamlid.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="title" className="text-sm font-medium">Titel</label>
                    <Input
                      id="title"
                      placeholder="Taak titel"
                      value={todoTitle}
                      onChange={(e) => setTodoTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="description" className="text-sm font-medium">Beschrijving</label>
                    <Textarea
                      id="description"
                      placeholder="Beschrijf de taak..."
                      value={todoDescription}
                      onChange={(e) => setTodoDescription(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="assignee" className="text-sm font-medium">Toewijzen aan</label>
                    <Select value={todoAssignee} onValueChange={setTodoAssignee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een persoon" />
                      </SelectTrigger>
                      <SelectContent>
                        {usersLoading ? (
                          <SelectItem value="loading" disabled>Laden...</SelectItem>
                        ) : (
                          users?.map((user: any) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.firstName} {user.lastName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="dueDate" className="text-sm font-medium">Deadline</label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={todoDueDate}
                      onChange={(e) => setTodoDueDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="priority" className="text-sm font-medium">Prioriteit</label>
                    <Select value={todoPriority} onValueChange={(val: any) => setTodoPriority(val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Prioriteit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Laag</SelectItem>
                        <SelectItem value="medium">Gemiddeld</SelectItem>
                        <SelectItem value="high">Hoog</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddTodoOpen(false)}>Annuleren</Button>
                  <Button onClick={handleAddTodo}>Toevoegen</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Toegewezen aan</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Prioriteit</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      Geen taken gevonden. Voeg een nieuwe taak toe.
                    </TableCell>
                  </TableRow>
                ) : (
                  todos.map((todo) => (
                    <TableRow key={todo.id}>
                      <TableCell>
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={() => handleToggleTodo(todo.id)}
                        />
                      </TableCell>
                      <TableCell className={todo.completed ? "line-through text-muted-foreground" : ""}>
                        <div>
                          <div className="font-medium">{todo.title}</div>
                          <div className="text-sm text-muted-foreground">{todo.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          {getUserName(todo.assignedTo)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(todo.dueDate), "d MMM yyyy", { locale: nl })}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                          {todo.priority === "high" ? "Hoog" : todo.priority === "medium" ? "Gemiddeld" : "Laag"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTodo(todo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Notities</h2>
            <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuwe notitie
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nieuwe notitie toevoegen</DialogTitle>
                  <DialogDescription>
                    Voeg een nieuwe notitie toe om te delen met het team.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="noteTitle" className="text-sm font-medium">Titel</label>
                    <Input
                      id="noteTitle"
                      placeholder="Notitie titel"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="noteContent" className="text-sm font-medium">Inhoud</label>
                    <Textarea
                      id="noteContent"
                      placeholder="Schrijf je notitie hier..."
                      rows={8}
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddNoteOpen(false)}>Annuleren</Button>
                  <Button onClick={handleAddNote}>Toevoegen</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Geen notities gevonden. Voeg een nieuwe notitie toe.
              </div>
            ) : (
              notes.map((note) => (
                <Card key={note.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{note.title}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>
                      Gemaakt door {getUserName(note.createdBy)} op {format(new Date(note.createdAt), "d MMM yyyy", { locale: nl })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{note.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Kwartaaldoelstellingen</h2>
            <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuwe doelstelling
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nieuwe doelstelling toevoegen</DialogTitle>
                  <DialogDescription>
                    Voeg een nieuwe kwartaaldoelstelling toe voor het team.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="goalTitle" className="text-sm font-medium">Titel</label>
                    <Input
                      id="goalTitle"
                      placeholder="Doelstelling titel"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="goalDescription" className="text-sm font-medium">Beschrijving</label>
                    <Textarea
                      id="goalDescription"
                      placeholder="Beschrijf de doelstelling..."
                      value={goalDescription}
                      onChange={(e) => setGoalDescription(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <label htmlFor="goalQuarter" className="text-sm font-medium">Kwartaal</label>
                      <Select value={goalQuarter} onValueChange={setGoalQuarter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer kwartaal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Q1">Q1</SelectItem>
                          <SelectItem value="Q2">Q2</SelectItem>
                          <SelectItem value="Q3">Q3</SelectItem>
                          <SelectItem value="Q4">Q4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="goalYear" className="text-sm font-medium">Jaar</label>
                      <Input
                        id="goalYear"
                        type="number"
                        value={goalYear}
                        onChange={(e) => setGoalYear(parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddGoalOpen(false)}>Annuleren</Button>
                  <Button onClick={handleAddGoal}>Toevoegen</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {goals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Geen doelstellingen gevonden. Voeg een nieuwe doelstelling toe.
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
                <Card key={goal.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(goal.status)}
                        <CardTitle>{goal.title}</CardTitle>
                      </div>
                      <span className="text-sm font-medium">
                        {goal.quarter} {goal.year}
                      </span>
                    </div>
                    <CardDescription>
                      {goal.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Status:</span>
                          <span className={getStatusColor(goal.status)}>
                            {goal.status === "planning" ? "Planning" : 
                             goal.status === "in-progress" ? "Bezig" : "Voltooid"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Voortgang:</span>
                          <span>{goal.progress}%</span>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between gap-2">
                        <Select 
                          value={goal.status} 
                          onValueChange={(val: any) => handleUpdateGoalStatus(goal.id, val)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="in-progress">Bezig</SelectItem>
                            <SelectItem value="completed">Voltooid</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={goal.progress}
                            onChange={(e) => handleUpdateGoalProgress(goal.id, parseInt(e.target.value))}
                            className="w-20"
                          />
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}