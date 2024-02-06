"use client";
import { fbSet } from "@/firebase/settersFe";
import { Step, VariableData } from "@/models/types/Step";
import { isEqual, uniq } from "lodash";
import { PromptDisplayWithVariables } from "./PromptDisplayWithVariables";
import { Timestamp } from "firebase/firestore";

export const getVariablesFromTemplate = (template: string) => {
  const regex = /{{(.*?)}}/g;
  const matches = template.matchAll(regex);
  const variables = uniq(Array.from(matches).map((match) => match[1]));
  return variables;
};

export const StepTemplateDisplay = ({
  step,
  variablesFromPreviousSteps,
}: {
  step: Step;
  variablesFromPreviousSteps: Record<string, VariableData>;
}) => {
  const allVariables = {
    ...variablesFromPreviousSteps,
    ...step.variableDescriptions,
  };
  return (
    <div className="p-2">
      <div>Prompt</div>
      <div>
        <PromptDisplayWithVariables
          variables={allVariables}
          template={step.template}
          placeholder="e.g. Send an email to {{email}} with the subject {{subject}}."
          onChange={(text) => {
            fbSet("step", step.uid, { template: text });
            const variableList = getVariablesFromTemplate(text);
            const variableListWithoutVariablesFromPreviousSteps =
              variableList.filter(
                (variable) => !variablesFromPreviousSteps[variable]
              );

            const existingVariableDescriptions =
              step.variableDescriptions || {};

            const variableDescriptions =
              variableListWithoutVariablesFromPreviousSteps.reduce(
                (acc, variable) => {
                  return {
                    ...acc,
                    [variable]: existingVariableDescriptions[variable] || {
                      createdAt: Timestamp.now(),
                      description: "",
                    },
                  };
                },
                {} as Record<string, VariableData>
              );

            if (!isEqual(variableDescriptions, existingVariableDescriptions)) {
              fbSet(
                "step",
                step.uid,
                { ...step, variableDescriptions },
                { merge: false }
              );
            }
          }}
        ></PromptDisplayWithVariables>
      </div>
    </div>
  );
};
