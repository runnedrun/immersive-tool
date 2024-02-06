"use client";
import { EditorContent, Extension, useEditor } from "@tiptap/react";
import { VariableData } from "@/models/types/Step";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  VariableHighlightExtension,
  VariableHighlightExtensionName,
} from "./VariableHighlightExtension";
import { getVariableNamesSorted } from "@/functions/src/triggers/processFlowRun/getVariableNamesSorted";
import { useEffect } from "react";

const getExtensions = (placeholder?: string) =>
  [
    StarterKit,
    placeholder
      ? Placeholder.configure({
          placeholder,
        })
      : null,
    VariableHighlightExtension,
  ].filter(Boolean) as Extension[];

export const PromptDisplayWithVariables = ({
  variables,
  template,
  onChange,
  placeholder,
}: {
  variables: Record<string, VariableData>;
  template: string;
  onChange: (newText: string) => void;
  placeholder?: string;
}) => {
  const editor = useEditor({
    extensions: getExtensions(placeholder),
    content: template,
    onUpdate: ({ editor }) => {
      onChange(editor.getText());
    },
  });
  const variableNames = getVariableNamesSorted(variables);

  useEffect(() => {
    if (editor) {
      editor.view.dispatch(
        editor.view.state.tr.setMeta(
          VariableHighlightExtensionName,
          variableNames
        )
      );
    }
  }, [variableNames, editor]);

  return (
    <div className="h-full bg-white p-2 overflow-auto">
      <EditorContent editor={editor}></EditorContent>
    </div>
  );
};
