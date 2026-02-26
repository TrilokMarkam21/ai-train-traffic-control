import { useState, useEffect } from 'react';
import { maintenanceService, Maintenance } from '../services/maintenanceService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  Wrench, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Plus, 
  Play, 
  CheckCircle,
  Filter,
  MapPin,
  Users
} from 'lucide-react';

const MaintenancePage = () => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadMaintenances();
  }, [filter]);

  const loadMaintenances = async () => {
    try {
      setLoading(true);
      const filters = filter !== 'all' ? { status: filter } : {};
      const data = await maintenanceService.getAllMaintenances(filters);
      setMaintenances(data);
    } catch (error) {
      console.error('Error loading maintenances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      await maintenanceService.seedMaintenances();
      await loadMaintenances();
    } catch (error) {
      console.error('Error seeding maintenances:', error);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await maintenanceService.startMaintenance(id);
      await loadMaintenances();
    } catch (error) {
      console.error('Error starting maintenance:', error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await maintenanceService.completeMaintenance(id);
      await loadMaintenances();
    } catch (error) {
      console.error('Error completing maintenance:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-500';
      case 'In Progress': return 'bg-yellow-500';
      case 'Completed': return 'bg-green-500';
      case 'Cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    return <Wrench className="h-4 w-4" />;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate summary stats
  const stats = {
    total: maintenances.length,
    scheduled: maintenances.filter(m => m.status === 'Scheduled').length,
    inProgress: maintenances.filter(m => m.status === 'In Progress').length,
    completed: maintenances.filter(m => m.status === 'Completed').length,
    critical: maintenances.filter(m => m.priority === 'Critical').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Scheduling</h1>
          <p className="text-muted-foreground">Track and manage track maintenance work and closures</p>
        </div>
        <Button onClick={handleSeed} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Seed Sample Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.critical}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'Scheduled' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('Scheduled')}
        >
          Scheduled
        </Button>
        <Button
          variant={filter === 'In Progress' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('In Progress')}
        >
          In Progress
        </Button>
        <Button
          variant={filter === 'Completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('Completed')}
        >
          Completed
        </Button>
      </div>

      {/* Maintenance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Works</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : maintenances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No maintenance works found. Click "Seed Sample Data" to load sample data.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Details</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenances.map((maintenance) => (
                  <TableRow key={maintenance._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{maintenance.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {maintenance.description.substring(0, 50)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {maintenance.startStation} → {maintenance.endStation}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTypeIcon(maintenance.type)}
                        <span className="ml-1">{maintenance.type}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(maintenance.scheduledStart)}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(maintenance.scheduledEnd)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(maintenance.priority)}>
                        {maintenance.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(maintenance.status)}>
                        {maintenance.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {maintenance.trackClosure && (
                          <div className="flex items-center gap-1 text-red-500">
                            <AlertTriangle className="h-3 w-3" />
                            Track Closure
                          </div>
                        )}
                        {maintenance.speedRestriction && (
                          <div>Speed: {maintenance.speedRestriction} km/h</div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {maintenance.crewCount} crew
                        </div>
                        <div className="text-orange-500">
                          +{maintenance.estimatedDelayMinutes} min delay
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {maintenance.status === 'Scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStart(maintenance._id!)}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        {maintenance.status === 'In Progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleComplete(maintenance._id!)}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenancePage;
