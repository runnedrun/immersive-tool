"use client";
import { Button } from "@/components/ui/button";
import { setup } from "@/firebase/feCallables";

const SetupScreen = () => {
  return (
    <div className="flex flex-col gap-4">
      <Button
        className="w-24"
        onClick={() => {
          setup({});
        }}
      >
        Setup data
      </Button>
    </div>
  );
};
export default SetupScreen;
