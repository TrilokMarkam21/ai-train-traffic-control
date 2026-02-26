import { useState, useEffect } from 'react';
import { scheduleService, Schedule } from '../services/scheduleService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Train, Clock, MapPin, Calendar, Plus } from 'lucide-react';

const SchedulesPage = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTrain, setSearchTrain] = useState('');
  const [searchStation, setSearchStation] = useState('');

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await scheduleService.getAllSchedules();
      setSchedules(data);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      await scheduleService.seedSchedules();
      await loadSchedules();
    } catch (error) {
      console.error('Error seeding schedules:', error);
    }
  };

  const handleSearchByTrain = async () => {
    if (!searchTrain) {
      loadSchedules();
      return;
    }
    try {
      setLoading(true);
      const data = await scheduleService.getSchedulesByTrain(searchTrain);
      setSchedules(data);
    } catch (error) {
      console.error('Error searching train:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByStation = async () => {
    if (!searchStation) {
      loadSchedules();
      return;
    }
    try {
      setLoading(true);
      const data = await scheduleService.getSchedulesByStation(searchStation.toUpperCase());
      setSchedules(data);
    } catch (error) {
      console.error('Error searching station:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group schedules by train number
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.trainNumber]) {
      acc[schedule.trainNumber] = [];
    }
    acc[schedule.trainNumber].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Train Schedules</h1>
          <p className="text-muted-foreground">View and manage train schedules across stations</p>
        </div>
        <Button onClick={handleSeed} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Seed Sample Data
        </Button>
      </div>

      {/* Search Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Train className="mr-2 h-4 w-4" />
              Search by Train Number
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter train number (e.g., 12951)"
                value={searchTrain}
                onChange={(e) => setSearchTrain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchByTrain()}
              />
              <Button onClick={handleSearchByTrain}>Search</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              Search by Station Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter station code (e.g., NDLS)"
                value={searchStation}
                onChange={(e) => setSearchStation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchByStation()}
              />
              <Button onClick={handleSearchByStation}>Search</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading schedules...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No schedules found. Click "Seed Sample Data" to load sample schedules.
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedSchedules).map(([trainNumber, trainSchedules]) => (
                <div key={trainNumber} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Train className="h-5 w-5" />
                      <span className="font-bold text-lg">Train {trainNumber}</span>
                    </div>
                    <Badge variant="outline">
                      {trainSchedules[0].dayOfWeek?.join(', ') || 'Daily'}
                    </Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Station</TableHead>
                        <TableHead>Arrival</TableHead>
                        <TableHead>Departure</TableHead>
                        <TableHead>Distance (km)</TableHead>
                        <TableHead>Platform</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trainSchedules
                        .sort((a, b) => a.distanceFromOrigin - b.distanceFromOrigin)
                        .map((schedule, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                {schedule.stationName} ({schedule.stationCode})
                              </div>
                            </TableCell>
                            <TableCell>
                              {schedule.arrivalTime ? (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  {schedule.arrivalTime}
                                </div>
                              ) : (
                                <Badge variant="secondary">Origin</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {schedule.departureTime ? (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  {schedule.departureTime}
                                </div>
                              ) : (
                                <Badge variant="secondary">Destination</Badge>
                              )}
                            </TableCell>
                            <TableCell>{schedule.distanceFromOrigin} km</TableCell>
                            <TableCell>
                              {schedule.platform ? (
                                <Badge>Platform {schedule.platform}</Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulesPage;
