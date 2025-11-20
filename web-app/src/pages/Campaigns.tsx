import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { toast } from "@/hooks/use-toast.ts";
import Navigation from "@/components/Navigation.tsx";
import api from "@/lib/api"; // <--- Import the secure API helper

interface Campaign {
  id: string;
  content_title: string; // Changed from 'title'
  content_body: string; // Changed from 'body'
  image_url?: string; // Changed from 'image'
}

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: "", body: "", image: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get("/api/v1/campaigns");
      // No mapping needed if interface matches DB
      setCampaigns(response.data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast({ title: "Error fetching campaigns", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // FIX: Map the form fields to match the Database Schema
      // The DB requires 'name', 'content_title', 'content_body'
      const payload = {
        name: formData.title, // Using Title as the internal Name
        content_title: formData.title, // Using Title as the notification Title
        content_body: formData.body, // Mapping Body to content_body
        image_url: formData.image, // Mapping Image to image_url
      };

      const response = await api.post("/api/v1/campaigns", payload);

      if (response.status === 201 || response.status === 200) {
        toast({ title: "Campaign created successfully" });
        setFormData({ title: "", body: "", image: "" });
        fetchCampaigns(); // Refresh the list
      }
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to create campaign";
      toast({ title: errorMessage, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Content Management System</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List of Existing Campaigns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading campaigns...</p>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <Card
                        key={campaign.id}
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      >
                        <CardContent className="p-4">
                          {/* Update variable names here too */}
                          <h3 className="font-bold text-lg">
                            {campaign.content_title}
                          </h3>
                          <p className="text-muted-foreground mt-2">
                            {campaign.content_body}
                          </p>
                          {campaign.image_url && (
                            <img
                              src={campaign.image_url}
                              alt={campaign.content_title}
                              className="mt-2 rounded max-h-32 object-cover"
                            />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {campaigns.length === 0 && (
                      <p className="text-muted-foreground">
                        No campaigns created yet.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Create Campaign Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Create Campaign</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                      placeholder="e.g. Summer Sale"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body">Body</Label>
                    <Textarea
                      id="body"
                      value={formData.body}
                      onChange={(e) =>
                        setFormData({ ...formData, body: e.target.value })
                      }
                      required
                      rows={4}
                      placeholder="Notification text..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      value={formData.image}
                      onChange={(e) =>
                        setFormData({ ...formData, image: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Campaign
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
