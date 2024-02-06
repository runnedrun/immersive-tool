"use client";

import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { withData } from "@/data/withData";
import { fbCreate, fbSet } from "@/firebase/settersFe";
import { PlusIcon } from "@heroicons/react/16/solid";
import { StepDisplay } from "./StepDisplay";
import { flowDataFn } from "./flowDataFn";
import { getAllDefinedVariablesForSteps } from "./getAllDefinedVariablesForSteps";

export const FlowDisplay = withData(flowDataFn, ({ data: { flow, steps } }) => {
  return (
    <div className="flex w-full justify-center mt-10">
      <div className="flex-col flex gap-6">
        <div className="w-[40rem] flex flex-col gap-3 p-3 bg-zinc-100 shadow-lg rounded-md">
          <div className="text-lg w-full">
            <div className="bg-gray-200 p-2 rounded-md">Flow:</div>
            <div>
              <Field>
                <Label>Title</Label>
                <Input
                  className={"border-none"}
                  value={flow.title || ""}
                  onChange={(e) => {
                    fbSet("flow", flow.uid, { title: e.target.value });
                  }}
                ></Input>
              </Field>
            </div>
            <div>
              <Field>
                <Label>
                  AI Name (Defaults to {'"'}AI{'"'})
                </Label>
                <Input
                  className={"border-none"}
                  value={flow.aiName || ""}
                  placeholder="AI Helper"
                  onChange={(e) => {
                    fbSet("flow", flow.uid, { aiName: e.target.value });
                  }}
                ></Input>
              </Field>
            </div>
            <div>
              <Field>
                <Label>Description</Label>
                <Input
                  className={"border-none"}
                  value={flow.description || ""}
                  onChange={(e) => {
                    fbSet("flow", flow.uid, { description: e.target.value });
                  }}
                ></Input>
              </Field>
            </div>
            <div>
              <Field>
                <Label>Introduction Message</Label>
                <Input
                  className={"border-none"}
                  value={flow.introductionMessage || ""}
                  onChange={(e) => {
                    fbSet("flow", flow.uid, {
                      introductionMessage: e.target.value,
                    });
                  }}
                ></Input>
              </Field>
            </div>
          </div>
        </div>
        <div className="w-[40rem] flex flex-col gap-3 p-3 shadow-lg rounded-md">
          <div className="flex flex-col gap-5">
            {steps.map((step, i) => {
              const previousSteps = steps.slice(0, i);
              const variablesFromPreviousSteps =
                getAllDefinedVariablesForSteps(previousSteps);
              return (
                <StepDisplay
                  key={step.uid}
                  step={step}
                  variablesFromPreviousSteps={variablesFromPreviousSteps}
                ></StepDisplay>
              );
            })}
          </div>
          <div>
            <Button
              onClick={() => {
                fbCreate("step", {
                  flowKey: flow.uid,
                  title: "New Step",
                  index: steps.length,
                  variableCollectionInstructions: null,
                  template: "",
                  outputVariableDescriptions: null,
                  responseDescription: null,
                  variableDescriptions: null,
                });
              }}
            >
              <PlusIcon></PlusIcon> Step
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
