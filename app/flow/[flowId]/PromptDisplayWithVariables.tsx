"use client"
import { Editor, EditorContent, Extension, useEditor } from "@tiptap/react"

import { VariableData } from "@/models/types/Step"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import {
  VariableHighlightExtension,
  VariableHighlightExtensionName,
} from "./VariableHighlightExtension"
import { getVariableNamesSorted } from "@/functions/src/triggers/processFlowRun/getVariableNamesSorted"
import { memo, useEffect } from "react"
import { isServerside } from "@/lib/isServerSide"
import { TextField } from "@mui/material"

const getExtensions = (placeholder?: string) =>
  [
    StarterKit,
    placeholder
      ? Placeholder.configure({
          placeholder,
        })
      : null,
    VariableHighlightExtension,
  ].filter(Boolean) as Extension[]

function domFromText(text: string): string {
  const dom = document.createElement("div")
  text.split(/(?:\r\n?|\n){2,}/).forEach((block) => {
    let p = dom.appendChild(document.createElement("p"))
    if (block) {
      block.split(/(?:\r\n?|\n)/).forEach((line) => {
        if (line) {
          if (p.hasChildNodes()) p.appendChild(document.createElement("br"))
          p.appendChild(document.createTextNode(line))
        }
      })
    }
    dom.appendChild(p)
  })
  return dom.outerHTML
}

const EditorDisplay = memo(function EditorDisplayTemp({
  editor,
}: {
  editor: Editor | null
}) {
  return (
    <div className="h-full overflow-auto bg-white p-2 text-sm">
      <EditorContent editor={editor}></EditorContent>
    </div>
  )
})

export const PromptDisplayWithVariables = ({
  variables,
  template,
  onChange,
  placeholder,
}: {
  variables: Record<string, VariableData>
  template: string
  onChange: (newText: string) => void
  placeholder?: string
}) => {
  const templateString = isServerside()
    ? template
    : domFromText(String(template || ""))
  const editor = useEditor(
    {
      extensions: getExtensions(placeholder),
      content: templateString || "",
      onUpdate: ({ editor }) => {
        onChange(editor.getText())
      },
    },
    []
  )

  const variableNames = getVariableNamesSorted(variables)

  useEffect(() => {
    if (editor) {
      editor.view.dispatch(
        editor.view.state.tr.setMeta(
          VariableHighlightExtensionName,
          variableNames
        )
      )
    }
  }, [JSON.stringify(variableNames), editor])

  return <EditorDisplay editor={editor}></EditorDisplay>
}
