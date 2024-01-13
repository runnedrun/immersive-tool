"use client";
import { withData } from "@/data/withData";
import { flowDataFn } from "./flowDataFn";
import { Input } from "@/components/ui/input";
import { fbSet } from "@/firebase/settersFe";

export const FlowDisplay = withData(flowDataFn, ({ data: { flow } }) => {
  return (
    <div>
      <div className="flex w-full justify-center">
        <div className="bg-gray-200 p-3 text-lg">
          <div>Flow:</div>
          <div>
            <Input
              className={"border-none"}
              value={flow.title || ""}
              onChange={(e) => {
                fbSet("flow", flow.uid, { title: e.target.value });
              }}
            ></Input>
          </div>
        </div>
        <div>
          <div>Prompt</div>
        </div>
      </div>
    </div>
  );
});
