import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/beacons", label: "Beacons" },
    { to: "/campaigns", label: "Campaigns" },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-8 py-4">
        <div className="flex items-center space-x-6">
          <h2 className="text-xl font-bold">Beacon Manager</h2>
          <div className="flex space-x-4">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === link.to
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
