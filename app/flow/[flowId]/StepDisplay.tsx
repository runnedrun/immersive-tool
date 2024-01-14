"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fbSet } from "@/firebase/settersFe";
import { Field, Label } from "@/components/ui/fieldset";
import { Step } from "@/models/types/Step";
import { StepTemplateDisplay } from "./StepTemplateDisplay";

export const StepDisplay = ({ step }: { step: Step }) => {
  const variableNames = Object.keys(step.variableDescriptions || {});
  const variableDisplay = variableNames.length ? (
    variableNames.map((variableName) => {
      const variableValue = step.variableDescriptions[variableName];
      return (
        <div key={variableName} className="flex gap-2 items-center">
          <div className="text-bold text-blue-400">{variableName}</div>
          <Input
            placeholder="description"
            className={"border-none"}
            value={variableValue || ""}
            onChange={(e) => {
              fbSet("step", step.uid, {
                variableDescriptions: {
                  ...step.variableDescriptions,
                  [variableName]: e.target.value,
                },
              });
            }}
          ></Input>
        </div>
      );
    })
  ) : (
    <div className="text-sm text-gray-600">No variables defined</div>
  );
  return (
    <div className=" border-zinc-300 flex flex-col gap-2 p-2">
      <div className="text-lg">Step {(step.index || 0) + 1}</div>
      <Field>
        <Label>Title</Label>
        <Input
          className={"border-none"}
          value={step.title || ""}
          onChange={(e) => {
            fbSet("step", step.uid, { title: e.target.value });
          }}
        ></Input>
      </Field>
      <Field>
        <Label>Extra Instructions for AI (optional)</Label>
        <Textarea
          className={"border-none"}
          value={step.title || ""}
          onChange={(e) => {
            fbSet("step", step.uid, { aiIntro: e.target.value });
          }}
        ></Textarea>
      </Field>
      <div className="border-gray-300 p-2 border">
        <div className="mb-2">Variables:</div>
        <div className="flex-col flex gap-2">{variableDisplay}</div>
      </div>
      <div>
        <StepTemplateDisplay step={step}></StepTemplateDisplay>
      </div>
    </div>
  );
};
