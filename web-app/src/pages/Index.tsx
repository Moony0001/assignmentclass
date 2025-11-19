import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if the user has a token
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="mb-4 text-4xl font-bold">Beacon Management System</h1>
        <p className="text-xl text-muted-foreground">Manage beacons, campaigns, and analytics</p>
        
        <div className="flex gap-4 justify-center">
          {isAuthenticated ? (
            // If logged in, prioritize the Dashboard link
            <Link to="/dashboard">
              <Button size="lg">Go to Dashboard</Button>
            </Link>
          ) : (
            // If not logged in, show Login and Dashboard (which will likely redirect)
            <>
              <Link to="/login">
                <Button>Login</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline">View Dashboard</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;