import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HardHat } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen construction-gradient flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <HardHat className="text-white text-xl" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">ContractorPro</h1>
            <p className="text-slate-600 mt-2">Construction Project Management</p>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-slate-600 text-center">
              Manage your construction projects, track costs, and automate receipt collection from subcontractors.
            </p>
            
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="w-full"
            >
              Sign In to Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
