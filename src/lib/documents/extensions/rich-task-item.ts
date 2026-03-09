import TaskItem from "@tiptap/extension-task-item"

export const RichTaskItem = TaskItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      itemId: {
        default: null,
        rendered: false,
        parseHTML: (element) => element.getAttribute("data-item-id"),
      },
    }
  },
})
