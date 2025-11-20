import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { toast } from "@/hooks/use-toast.ts";
import Navigation from "@/components/Navigation.tsx";
import api from "@/lib/api"; // <--- FIX 1: Import the secure API helper

interface Campaign {
  id: string;
  content_title: string;
  content_body: string;
  image_url?: string;
}

interface Beacon {
  id: string;
  name: string;
  uuid: string;
}

const CampaignEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [beacons, setBeacons] = useState<Beacon[]>([]);
  const [selectedBeacons, setSelectedBeacons] = useState<string[]>([]);
  const [formData, setFormData] = useState({ title: "", body: "", image: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCampaign();
      fetchBeacons();
    }
  }, [id]);

  const fetchCampaign = async () => {
    try {
      // FIX 2: Use api.get for authentication
      const response = await api.get('/api/v1/campaigns');
      
      // Note: Ideally your API should support GET /api/v1/campaigns/:id
      // But we keep your logic of fetching all and finding the one we need
      const campaigns = response.data;
      const currentCampaign = campaigns.find((c: Campaign) => c.id === id);
      
      if (currentCampaign) {
        setCampaign(currentCampaign);
        setFormData({
          title: currentCampaign.content_title,
          body: currentCampaign.content_body,
          image: currentCampaign.image_url || "",
        });
        // If your API returns linked beacons, you would set selectedBeacons here
      } else {
        toast({ title: "Campaign not found", variant: "destructive" });
        navigate('/campaigns');
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast({ title: "Error fetching campaign details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchBeacons = async () => {
    try {
      // FIX 3: Use api.get for authentication
      const response = await api.get('/api/v1/beacons');
      setBeacons(response.data);
    } catch (error) {
      console.error("Error fetching beacons:", error);
      toast({ title: "Error fetching beacons", variant: "destructive" });
    }
  };

  const handleBeaconToggle = (beaconId: string) => {
    setSelectedBeacons(prev =>
      prev.includes(beaconId)
        ? prev.filter(id => id !== beaconId)
        : [...prev, beaconId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    try {
      // FIX 4: Actually send the update to the server
      // We send the form data AND the selected beacons (triggers)
      const payload = {
        name: formData.title,
        content_title: formData.title,
        content_body: formData.body,
        image_url: formData.image,
        beacon_ids: selectedBeacons // We send the list of selected triggers
      };

      // Assuming your API supports PUT for updates
      await api.put(`/api/v1/campaigns/${id}`, payload);

      toast({ title: "Campaign updated successfully" });
      navigate('/campaigns');
    } catch (error: any) {
      console.error("Error updating campaign:", error);
      const errorMessage = error.response?.data?.error || "Failed to update campaign";
      toast({ title: "Error updating campaign", description: errorMessage, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="p-8">Loading campaign details...</div>;
  }

  if (!campaign) {
    return <div className="p-8">Campaign not found.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-8">
        <Button variant="outline" onClick={() => navigate('/campaigns')} className="mb-4">
          ← Back to Campaigns
        </Button>
        
        <h1 className="text-3xl font-bold mb-8">Edit Campaign</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Campaign Details Form */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Body</Label>
                  <Textarea
                    id="body"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    required
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Save Changes</Button>
              </form>
            </CardContent>
          </Card>

          {/* Beacon Linking (Triggers) */}
          <Card>
            <CardHeader>
              <CardTitle>Active Triggers</CardTitle>
              <p className="text-sm text-muted-foreground">Select which beacons trigger this campaign.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {beacons.map((beacon) => (
                  <div key={beacon.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md">
                    <Checkbox
                      id={beacon.id}
                      checked={selectedBeacons.includes(beacon.id)}
                      onCheckedChange={() => handleBeaconToggle(beacon.id)}
                    />
                    <Label htmlFor={beacon.id} className="cursor-pointer flex-grow">
                      <span className="font-medium">{beacon.name}</span>
                      <span className="block text-xs text-muted-foreground font-mono">{beacon.uuid}</span>
                    </Label>
                  </div>
                ))}
                {beacons.length === 0 && <p className="text-muted-foreground">No beacons registered.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CampaignEdit;