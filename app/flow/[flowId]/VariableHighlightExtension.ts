import { Extension } from "@tiptap/core";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Plugin, TextSelection } from "prosemirror-state";
import { Observable } from "rxjs";
import { PluginKey } from "@tiptap/pm/state";

export const VariableHighlightExtensionName = "variableHighlight";

export const VariableHighlightExtension = Extension.create({
  name: VariableHighlightExtensionName,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey(VariableHighlightExtensionName),
        state: {
          init() {
            return [] as string[];
          },
          apply(tr, prev) {
            const availableVariables = (tr.getMeta(
              VariableHighlightExtensionName
            ) || []) as string[];
            if (availableVariables) {
              return availableVariables;
            } else {
              return prev;
            }
          },
        },
        props: {
          decorations(state) {
            const availableVariables = this.getState(state) || [];
            const decorations: Decoration[] = [];
            const pattern = /{{([\w\s]+)}}/g;

            state.doc.descendants((node, pos) => {
              if (!node.isText) return;

              const text = node.text ?? "";
              let match;
              while ((match = pattern.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;
                const word = match[1];

                if (!availableVariables.includes(word)) continue;

                const decoration = Decoration.inline(start, end, {
                  style: "color: blue;",
                });
                decorations.push(decoration);
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
