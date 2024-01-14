import { Extension } from "@tiptap/core";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Plugin, TextSelection } from "prosemirror-state";

export const VariableHighlightExtension = Extension.create({
  name: "variableHighlight",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            const { doc, tr } = state;
            const pattern = /{{\w+}}/g;

            doc.descendants((node, pos) => {
              if (!node.isText) return;

              const text = node.text ?? "";
              let match;
              while ((match = pattern.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;
                const decoration = Decoration.inline(start, end, {
                  style: "color: blue;",
                });
                decorations.push(decoration);
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
