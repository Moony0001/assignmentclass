import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { toast } from "@/hooks/use-toast.ts";
import Navigation from "@/components/Navigation.tsx";
import api from "@/lib/api"; // <--- FIX 1: Import the secure API helper

interface AnalyticsSummary {
  storeTraffic: number;
  campaignViews: number;
  beaconEvents: number;
  activeBeacons: number;
}

const Dashboard = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // FIX 2: Use api.get (Axios) for authenticated requests
      const response = await api.get('/api/v1/analytics/summary');
      
      // Axios automatically parses JSON into response.data
      setData(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({ title: "Error fetching analytics", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
        
        {loading ? (
          <p>Loading analytics...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Traffic</CardTitle>
                <CardDescription>Total visits</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{data?.storeTraffic || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Views</CardTitle>
                <CardDescription>Total views</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{data?.campaignViews || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Beacon Events</CardTitle>
                <CardDescription>Total events</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{data?.beaconEvents || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Beacons</CardTitle>
                <CardDescription>Currently active</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{data?.activeBeacons || 0}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;