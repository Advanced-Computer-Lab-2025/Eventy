import { useState } from "react";
import MobileNav from "../MobileNav";

export default function MobileNavExample() {
  const [activeTab, setActiveTab] = useState("discover");

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 p-6 pb-20">
        <p className="text-center text-muted-foreground">
          Active tab: {activeTab}
        </p>
      </div>
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
