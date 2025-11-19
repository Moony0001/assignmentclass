import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { toast } from "@/hooks/use-toast.ts";
import Navigation from "@/components/Navigation.tsx";
import api from "@/lib/api";

interface Beacon {
  id: string;
  name: string;
  uuid: string;
  major: number;
  minor: number;
  last_battery_level?: number;
}

const Beacons = () => {
  const [beacons, setBeacons] = useState<Beacon[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", uuid: "", major: "", minor: "" });
  const [error, setError] = useState('');
  const [storeId, setStoreId] = useState('adca84f9-5dbd-404c-b4ed-8a6a1317f757');

  useEffect(() => {
    fetchBeacons();
  }, []);

  const fetchBeacons = async () => {
    try {
      const response = await api.get('/api/v1/beacons');
      setBeacons(response.data);
    } catch (error) {
      console.error("Error fetching beacons:", error);
      toast({ title: "Error fetching beacons. Check API status.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!storeId ||!formData.name ||!formData.uuid ||!formData.major ||!formData.minor) {
        setError("All fields (including Store ID) are required.");
        return;
    }
    try {
      // USE api.post INSTEAD OF fetch
      const response = await api.post('/api/v1/beacons', {
        name: formData.name,
        uuid: formData.uuid.toUpperCase(),
        major: parseInt(formData.major),
        minor: parseInt(formData.minor),
        store_id: storeId,
      });

      // Axios (api.post) returns status directly in the response object
      if (response.status === 201 || response.status === 200) {
        toast({ title: "Beacon registered successfully" });
        setFormData({ name: "", uuid: "", major: "", minor: "" });
        fetchBeacons();
      }
    } catch (error: any) {
      console.error("Error registering beacon:", error.response || error);
      // Handle Axios error structure
      const errorMessage = error.response?.data?.error || "Check API server console for database error.";
      toast({ title: "Error registering beacon", description: errorMessage, variant: "destructive" });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof formData) => {
    setFormData({...formData, [field]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Fleet Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Beacons</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading beacons...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>UUID</TableHead>
                        <TableHead>Major</TableHead>
                        <TableHead>Minor</TableHead>
                        <TableHead>Battery</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {beacons.map((beacon) => (
                        <TableRow key={beacon.id}>
                          <TableCell>{beacon.name}</TableCell>
                          <TableCell className="font-mono text-sm">{beacon.uuid}</TableCell>
                          <TableCell>{beacon.major}</TableCell>
                          <TableCell>{beacon.minor}</TableCell>
                          <TableCell>{beacon.last_battery_level ? `${beacon.last_battery_level}%` : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Register New Beacon</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uuid">UUID</Label>
                    <Input
                      id="uuid"
                      value={formData.uuid}
                      onChange={(e) => setFormData({ ...formData, uuid: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="major">Major</Label>
                    <Input
                      id="major"
                      type="number"
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minor">Minor</Label>
                    <Input
                      id="minor"
                      type="number"
                      value={formData.minor}
                      onChange={(e) => setFormData({ ...formData, minor: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Register Beacon</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Beacons;
