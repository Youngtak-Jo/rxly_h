import Heading from "@tiptap/extension-heading"

export const RichHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      sectionKey: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-section-key"),
        renderHTML: (attributes) =>
          attributes.sectionKey
            ? { "data-section-key": attributes.sectionKey }
            : {},
      },
      conditionId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-condition-id"),
        renderHTML: (attributes) =>
          attributes.conditionId
            ? { "data-condition-id": attributes.conditionId }
            : {},
      },
      sectionKind: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-section-kind"),
        renderHTML: (attributes) =>
          attributes.sectionKind
            ? { "data-section-kind": attributes.sectionKind }
            : {},
      },
    }
  },
})
