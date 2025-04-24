import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { DateRange } from "react-day-picker";
import { format, subDays, startOfDay, endOfDay, differenceInDays, addDays } from "date-fns";
import { nl } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// Kleurenpalet voor grafieken
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C'];

const Analytics = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const [selectedPeriod, setSelectedPeriod] = useState<string>("month");

  // Haal analyticsgegevens op
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: [
      '/api/stats', 
      dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
    ],
    select: (data: any) => data
  });

  // Hulpfunctie voor het formatteren van datumbereiken
  const formatDateRange = () => {
    if (!dateRange?.from) return "";
    if (!dateRange?.to) {
      return format(dateRange.from, "d MMMM yyyy", { locale: nl });
    }
    return `${format(dateRange.from, "d MMM", { locale: nl })} - ${format(dateRange.to, "d MMM yyyy", { locale: nl })}`;
  };

  // Verschillende perioden instellen
  const handlePeriodChange = (period: string) => {
    const today = new Date();
    
    switch (period) {
      case "today":
        setDateRange({ from: today, to: today });
        break;
      case "week":
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case "month":
        setDateRange({ from: subDays(today, 30), to: today });
        break;
      case "year":
        setDateRange({ from: subDays(today, 365), to: today });
        break;
      default:
        break;
    }
    
    setSelectedPeriod(period);
  };

  // Genereer voorbeeldgegevens voor grafieken als er geen echte gegevens zijn
  const getTransactionsData = () => {
    if (!dateRange?.from || !dateRange?.to) {
      return [];
    }

    // Als er echte gegevens zijn, gebruik deze
    if (analyticsData?.transactionsPerDay && analyticsData.transactionsPerDay.length > 0) {
      return analyticsData.transactionsPerDay;
    }
    
    // Anders genereer voorbeeldgegevens
    const days = differenceInDays(dateRange.to, dateRange.from) + 1;
    const result = [];
    
    for (let i = 0; i < days; i++) {
      const date = addDays(dateRange.from, i);
      result.push({
        date: format(date, 'yyyy-MM-dd'),
        naam: format(date, 'd MMM', { locale: nl }),
        earned: Math.floor(Math.random() * 50),
        redeemed: Math.floor(Math.random() * 20),
      });
    }
    
    return result;
  };

  // Bereken statistieken
  const calculateStats = () => {
    const transactionsData = getTransactionsData();
    
    const totalEarned = transactionsData.reduce((sum: number, item: any) => sum + (item.earned || 0), 0);
    const totalRedeemed = transactionsData.reduce((sum: number, item: any) => sum + (item.redeemed || 0), 0);
    const balance = totalEarned - totalRedeemed;
    
    return {
      totalEarned,
      totalRedeemed,
      balance
    };
  };

  const stats = calculateStats();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-500">
          Bekijk statistieken en rapporten over punten, beloningen en meer.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="diversen">Diversen</TabsTrigger>
        </TabsList>

        <div className="flex justify-between items-center mt-6">
          <div className="space-y-1">
            <div className="flex space-x-2">
              <Button
                variant={selectedPeriod === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodChange("today")}
              >
                Vandaag
              </Button>
              <Button
                variant={selectedPeriod === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodChange("week")}
              >
                Deze week
              </Button>
              <Button
                variant={selectedPeriod === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodChange("month")}
              >
                Deze maand
              </Button>
              <Button
                variant={selectedPeriod === "year" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodChange("year")}
              >
                Dit jaar
              </Button>
              <Button
                variant={selectedPeriod === "custom" ? "default" : "outline"}
                size="sm"
                className="ml-2"
                onClick={() => setSelectedPeriod("custom")}
              >
                Aangepast
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    formatDateRange()
                  ) : (
                    <span>Kies een periode</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(selected) => {
                    setDateRange(selected);
                    setSelectedPeriod("custom");
                  }}
                  numberOfMonths={2}
                  locale={nl}
                />
              </PopoverContent>
            </Popover>
            <Button size="sm" variant="ghost" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="dashboard" className="mt-6 space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Totaal verdiende punten</CardTitle>
                <CardDescription>Deze periode</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEarned}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData?.earnedGrowth > 0 
                    ? `+${analyticsData?.earnedGrowth}% t.o.v. vorige periode`
                    : analyticsData?.earnedGrowth < 0
                      ? `${analyticsData?.earnedGrowth}% t.o.v. vorige periode`
                      : "Geen verandering t.o.v. vorige periode"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ingewisselde punten</CardTitle>
                <CardDescription>Deze periode</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRedeemed}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData?.redeemedGrowth > 0 
                    ? `+${analyticsData?.redeemedGrowth}% t.o.v. vorige periode`
                    : analyticsData?.redeemedGrowth < 0
                      ? `${analyticsData?.redeemedGrowth}% t.o.v. vorige periode`
                      : "Geen verandering t.o.v. vorige periode"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Puntenbalans</CardTitle>
                <CardDescription>Verdiend - ingewisseld</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.balance}</div>
                <p className="text-xs text-muted-foreground">
                  Verschil tussen verdiende en ingewisselde punten
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Punten Activiteit</CardTitle>
              <CardDescription>
                Overzicht van verdiende en ingewisselde punten over tijd
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getTransactionsData()}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="naam" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="earned" name="Verdiende punten" fill="#0088FE" />
                    <Bar dataKey="redeemed" name="Ingewisselde punten" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Populaire beloningen</CardTitle>
                <CardDescription>
                  Meest ingewisselde beloningen in deze periode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData?.popularRewards || [
                          { name: "Apple AirPods", value: 12 },
                          { name: "Cadeaubon €25", value: 8 },
                          { name: "Extra verlofdag", value: 5 },
                          { name: "Diner voor twee", value: 4 },
                          { name: "Bioscoopkaartjes", value: 3 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(analyticsData?.popularRewards || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gebruikersactiviteit</CardTitle>
                <CardDescription>
                  Actieve gebruikers per dag
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={analyticsData?.userActivity || getTransactionsData().map((item: any) => ({
                        ...item,
                        activeUsers: Math.floor(Math.random() * 40) + 10
                      }))}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="naam" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="activeUsers"
                        name="Actieve gebruikers"
                        stroke="#00C49F"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diversen" className="mt-6 space-y-8">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Retentie Analytics</CardTitle>
                <CardDescription>
                  Hoe lang blijven medewerkers actief in het punten programma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={analyticsData?.retention || [
                        { month: "Maand 1", retentie: 100 },
                        { month: "Maand 2", retentie: 85 },
                        { month: "Maand 3", retentie: 75 },
                        { month: "Maand 4", retentie: 68 },
                        { month: "Maand 5", retentie: 60 },
                        { month: "Maand 6", retentie: 55 }
                      ]}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="retentie"
                        name="Retentiepercentage"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Punten per bron</CardTitle>
                <CardDescription>
                  Verdeling van verdiende punten per bron
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData?.pointsBySource || [
                        { name: "Verjaardagen", punten: 1500 },
                        { name: "Shifts", punten: 4200 },
                        { name: "Reviews", punten: 900 },
                        { name: "Referrals", punten: 1200 },
                        { name: "Diensttijd", punten: 2400 },
                        { name: "Bonus", punten: 800 }
                      ]}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="punten" name="Punten" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;