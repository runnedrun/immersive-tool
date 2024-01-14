"use client";
import { EditorContent, useEditor } from "@tiptap/react";
import { fbSet } from "@/firebase/settersFe";
import { Step } from "@/models/types/Step";
import { isEqual, uniq } from "lodash";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { VariableHighlightExtension } from "./VariableHighlightExtension";

const extensions = [
  StarterKit,
  Placeholder.configure({
    placeholder: "ex. Please send and email to {{email}}",
  }),
  VariableHighlightExtension,
];

export const getVariablesFromTemplate = (template: string) => {
  const regex = /{{(.*?)}}/g;
  const matches = template.matchAll(regex);
  const variables = uniq(Array.from(matches).map((match) => match[1]));
  return variables;
};

export const StepTemplateDisplay = ({ step }: { step: Step }) => {
  const editor = useEditor({
    extensions,
    content: step.template,
    onUpdate: ({ editor }) => {
      const text = editor.state.doc.textContent;
      fbSet("step", step.uid, { template: text });
      const variableList = getVariablesFromTemplate(text);
      const existingVariableDescriptions = step.variableDescriptions || {};
      const variableDescriptions = variableList.reduce((acc, variable) => {
        return {
          ...acc,
          [variable]: existingVariableDescriptions[variable] || "",
        };
      }, {});
      if (!isEqual(variableDescriptions, existingVariableDescriptions)) {
        fbSet("step", step.uid, { variableDescriptions });
      }
    },
  });
  return (
    <div className="h-72 bg-white p-2">
      <EditorContent editor={editor}></EditorContent>
    </div>
  );
};
