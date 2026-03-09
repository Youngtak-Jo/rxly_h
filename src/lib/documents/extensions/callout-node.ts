import { mergeAttributes, Node } from "@tiptap/core"

type CalloutVariant = "note" | "warning" | "success"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      insertCallout: (attrs?: { variant?: CalloutVariant }) => ReturnType
      updateCallout: (attrs?: { variant?: CalloutVariant }) => ReturnType
    }
  }
}

export const CalloutNode = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      variant: {
        default: "note",
        parseHTML: (element) => element.getAttribute("data-callout") || "note",
        renderHTML: (attributes) => ({
          "data-callout": attributes.variant || "note",
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        {
          class:
            "rxly-document-callout rounded-xl border px-4 py-3",
        },
        HTMLAttributes
      ),
      0,
    ]
  },

  addCommands() {
    return {
      insertCallout:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { variant: attrs.variant || "note" },
            content: [{ type: "paragraph" }],
          }),
      updateCallout:
        (attrs = {}) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, {
            variant: attrs.variant || "note",
          }),
    }
  },
})
