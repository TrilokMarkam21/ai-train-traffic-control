import { useState, useEffect } from 'react';
import trafficControlApi from '../api/trafficControlApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { AlertTriangle, Train, Activity, Clock, TrendingUp, Shield, RefreshCw, Brain } from 'lucide-react';
import { Button } from '../components/ui/button';

interface SectionOccupancy {
  sectionId: string;
  name: string;
  startStation: string;
  endStation: string;
  status: string;
  occupancyPercentage: number;
  trains: Array<{
    trainNumber: string;
    trainName: string;
    speedKmph: number;
    status: string;
    delay: number;
    priority: number;
  }>;
}

interface Conflict {
  type: string;
  severity: string;
  section: string;
  trains: Array<{ trainNumber: string; role: string }>;
  recommendation: string;
}

interface Adherence {
  trainNumber: string;
  trainName: string;
  status: string;
  delay: number;
  delayStatus: string;
  currentSection: string;
  scheduledProgress: number;
  nextStation: string;
}

interface DelayImpact {
  sourceTrain: { trainNumber: string; delay: number; destination: string };
  impactedTrains: Array<{ trainNumber: string; delay: number }>;
  totalImpactMinutes: number;
  recommendation: string;
}

interface Recommendation {
  type: string;
  priority: string;
  message: string;
}

const TrafficControlPage = () => {
  const [loading, setLoading] = useState(true);
  const [occupancy, setOccupancy] = useState<SectionOccupancy[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [adherence, setAdherence] = useState<Adherence[]>([]);
  const [delayImpact, setDelayImpact] = useState<DelayImpact[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState<any>({});

  // Advanced conflict analysis state
  const [showAdvancedConflicts, setShowAdvancedConflicts] = useState(false);
  const [advancedConflicts, setAdvancedConflicts] = useState<any>(null);
  const [loadingAdvanced, setLoadingAdvanced] = useState(false);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await trafficControlApi.getDashboard();
      setOccupancy(data.occupancy || []);
      setConflicts(data.conflicts || []);
      setAdherence(data.adherence || []);
      setDelayImpact(data.delayImpact || []);
      setRecommendations(data.recommendations || []);
      setSummary(data.summary || {});
    } catch (error) {
      console.error('Error loading traffic dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdvancedConflicts = async () => {
    try {
      setLoadingAdvanced(true);
      const data = await trafficControlApi.getAdvancedConflicts();
      setAdvancedConflicts(data);
    } catch (error) {
      console.error('Error loading advanced conflicts:', error);
    } finally {
      setLoadingAdvanced(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Clear': return 'bg-green-500';
      case 'Occupied': return 'bg-yellow-500';
      case 'Congested': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDelayColor = (delay: number) => {
    if (delay <= 0) return 'text-green-500';
    if (delay <= 5) return 'text-yellow-500';
    if (delay <= 15) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Traffic Control Dashboard</h1>
          <p className="text-muted-foreground">Real-time traffic monitoring and throughput optimization</p>
        </div>
        <button
          onClick={loadDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <Button
          variant={showAdvancedConflicts ? "default" : "outline"}
          onClick={() => {
            if (!showAdvancedConflicts) {
              loadAdvancedConflicts();
            }
            setShowAdvancedConflicts(!showAdvancedConflicts);
          }}
          className="flex items-center gap-2"
        >
          <Brain className="h-4 w-4" />
          AI Conflict Analysis
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Section Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.occupiedSections}/{summary.totalSections}
            </div>
            <p className="text-xs text-muted-foreground">sections occupied</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {summary.totalConflicts}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.criticalConflicts} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Train className="h-4 w-4" />
              On-Time Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {summary.onTimeTrains}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.delayedTrains} delayed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Average Delay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.avgDelayMinutes} min
            </div>
            <p className="text-xs text-muted-foreground">across all trains</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg flex items-start gap-3 ${
                    rec.priority === 'High' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <Shield className={`h-5 w-5 mt-0.5 ${rec.priority === 'High' ? 'text-red-500' : 'text-yellow-500'}`} />
                  <div>
                    <p className="font-medium">{rec.type}</p>
                    <p className="text-sm text-muted-foreground">{rec.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Occupancy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Section Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : occupancy.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No section data available</div>
            ) : (
              <div className="space-y-3">
                {occupancy.map((section) => (
                  <div key={section.sectionId} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{section.name}</span>
                      <Badge className={getStatusColor(section.status)}>
                        {section.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {section.startStation} → {section.endStation}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getStatusColor(section.status)}`}
                          style={{ width: `${section.occupancyPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs">{section.occupancyPercentage}%</span>
                    </div>
                    {section.trains.length > 0 && (
                      <div className="mt-2 text-xs">
                        Trains: {section.trains.map(t => t.trainNumber).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conflicts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conflict Detection</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : conflicts.length === 0 ? (
              <div className="text-center py-4 text-green-500">
                ✓ No conflicts detected - traffic flow is optimal
              </div>
            ) : (
              <div className="space-y-3">
                {conflicts.map((conflict, idx) => (
                  <div key={idx} className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{conflict.type}</span>
                      <Badge variant="outline">{conflict.severity}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Section: {conflict.section}
                    </div>
                    <div className="text-xs">
                      {conflict.trains.map(t => `${t.trainNumber} (${t.role})`).join(' → ')}
                    </div>
                    <div className="mt-2 text-xs text-yellow-700">
                      {conflict.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule Adherence */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Schedule Adherence</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : adherence.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No adherence data available</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Train</TableHead>
                  <TableHead>Current Section</TableHead>
                  <TableHead>Next Station</TableHead>
                  <TableHead>Delay</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adherence.slice(0, 10).map((train) => (
                  <TableRow key={train.trainNumber}>
                    <TableCell className="font-medium">{train.trainNumber}</TableCell>
                    <TableCell>{train.currentSection}</TableCell>
                    <TableCell>{train.nextStation}</TableCell>
                    <TableCell className={getDelayColor(train.delay)}>
                      {train.delay > 0 ? '+' : ''}{train.delay} min
                    </TableCell>
                    <TableCell>
                      <Badge variant={train.delayStatus === 'On Time' ? 'default' : 'destructive'}>
                        {train.delayStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delay Impact */}
      {delayImpact.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delay Impact Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {delayImpact.map((impact, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Source: {impact.sourceTrain.trainNumber}</span>
                    <Badge variant="destructive">+{impact.sourceTrain.delay} min</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Impacted: {impact.impactedTrains.map(t => t.trainNumber).join(', ')}
                  </div>
                  <div className="text-xs text-orange-600">
                    {impact.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Conflict Analysis Panel */}
      {showAdvancedConflicts && (
        <Card className="border-purple-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              AI-Powered Conflict Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAdvanced ? (
              <div className="text-center py-8">Loading AI analysis...</div>
            ) : advancedConflicts ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{advancedConflicts.summary?.critical || 0}</div>
                    <div className="text-xs text-red-600">Critical</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{advancedConflicts.summary?.high || 0}</div>
                    <div className="text-xs text-orange-600">High</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{advancedConflicts.summary?.medium || 0}</div>
                    <div className="text-xs text-yellow-600">Medium</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{advancedConflicts.summary?.low || 0}</div>
                    <div className="text-xs text-green-600">Low</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{advancedConflicts.optimization?.total_expected_delay_reduction || 0} min</div>
                    <div className="text-xs text-purple-600">Delay Reduction</div>
                  </div>
                </div>
                {advancedConflicts.conflicts?.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="font-medium">Detected Conflicts:</h4>
                    {advancedConflicts.conflicts.map((conflict: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{conflict.type} Conflict</span>
                          <span className={`px-2 py-1 rounded text-xs ${conflict.severity === 'Critical' ? 'bg-red-100 text-red-800' : conflict.severity === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {conflict.severity}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{conflict.description}</p>
                        {conflict.resolution && (
                          <p className="text-sm text-purple-600 mt-2">📋 {conflict.resolution.recommendation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-green-600">
                    ✓ No conflicts detected - System operating normally
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Click "AI Conflict Analysis" to load analysis
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrafficControlPage;
