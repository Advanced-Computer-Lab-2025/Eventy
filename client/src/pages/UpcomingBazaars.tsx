import PageLayout from "@/components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Store } from "lucide-react";

export default function UpcomingBazaars() {
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Store className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Upcoming Bazaars</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Discover and explore upcoming bazaars at GUC
          </p>
        </div>

        {/* Content Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Bazaars List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bazaars available</h3>
              <p className="text-muted-foreground mb-4">
                Check back later for upcoming bazaars
              </p>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                View All Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
