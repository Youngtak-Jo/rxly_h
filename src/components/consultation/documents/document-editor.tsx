"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import {
  IconBlockquote,
  IconBold,
  IconChecklist,
  IconH1,
  IconH2,
  IconH3,
  IconLink,
  IconList,
  IconListNumbers,
  IconMessageCircle,
  IconMinus,
  IconPhoto,
  IconTable,
  IconUnderline,
} from "@tabler/icons-react"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"
import {
  createRichTextExtensions,
  emptyRichTextDocument,
  normalizeRichTextDocument,
  type RichTextDocument,
} from "@/lib/documents/rich-text"

interface SlashCommandItem {
  key: string
  label: string
  aliases: string[]
  run: (editor: Editor, range: { from: number; to: number }) => void
}

interface SlashMenuState {
  open: boolean
  query: string
  top: number
  left: number
  range: { from: number; to: number } | null
}

interface DocumentEditorProps {
  value: RichTextDocument | null | undefined
  onChange?: (value: RichTextDocument) => void
  placeholder?: string
  readOnly?: boolean
  embedded?: boolean
  toolbarMode?: "inline" | "sticky"
  className?: string
  canvasClassName?: string
  autoFocus?: boolean
}

function ToolbarButton({
  pressed,
  onPressedChange,
  title,
  children,
  disabled,
}: {
  pressed?: boolean
  onPressedChange: () => void
  title: string
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <Toggle
      variant="outline"
      size="sm"
      className="shrink-0"
      pressed={pressed}
      onPressedChange={onPressedChange}
      aria-label={title}
      title={title}
      disabled={disabled}
    >
      {children}
    </Toggle>
  )
}

function insertLink(editor: Editor) {
  const previous = editor.getAttributes("link").href as string | undefined
  const href = window.prompt("Link URL", previous || "https://")
  if (href === null) return

  const trimmed = href.trim()
  if (!trimmed) {
    editor.chain().focus().extendMarkRange("link").unsetLink().run()
    return
  }

  editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: trimmed })
    .run()
}

function insertImage(editor: Editor) {
  const src = window.prompt("Image URL", "https://")
  if (!src) return
  const alt = window.prompt("Image description", "") || ""
  editor.chain().focus().setImage({ src: src.trim(), alt }).run()
}

function buildSlashCommands(): SlashCommandItem[] {
  return [
    {
      key: "text",
      label: "Text",
      aliases: ["paragraph", "plain", "body"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).setParagraph().run()
      },
    },
    {
      key: "heading-1",
      label: "Heading 1",
      aliases: ["h1", "title"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run()
      },
    },
    {
      key: "heading-2",
      label: "Heading 2",
      aliases: ["h2", "section"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run()
      },
    },
    {
      key: "heading-3",
      label: "Heading 3",
      aliases: ["h3", "subsection"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run()
      },
    },
    {
      key: "bullet-list",
      label: "Bullet List",
      aliases: ["bullets", "list"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    },
    {
      key: "numbered-list",
      label: "Numbered List",
      aliases: ["ordered", "numbers"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    },
    {
      key: "checklist",
      label: "Checklist",
      aliases: ["task", "todo"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run()
      },
    },
    {
      key: "blockquote",
      label: "Quote",
      aliases: ["blockquote", "quote"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run()
      },
    },
    {
      key: "callout",
      label: "Callout",
      aliases: ["note", "info"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).insertCallout({ variant: "note" }).run()
      },
    },
    {
      key: "divider",
      label: "Divider",
      aliases: ["rule", "separator"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run()
      },
    },
    {
      key: "table",
      label: "Table",
      aliases: ["grid"],
      run: (editor, range) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run()
      },
    },
    {
      key: "image",
      label: "Image",
      aliases: ["photo", "media"],
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).run()
        insertImage(editor)
      },
    },
  ]
}

function createSlashMenuState(): SlashMenuState {
  return {
    open: false,
    query: "",
    top: 0,
    left: 0,
    range: null,
  }
}

function updateSlashMenu(editor: Editor, container: HTMLDivElement | null) {
  const { state, view } = editor
  const { selection } = state
  if (!selection.empty || !container || !editor.isEditable) {
    return createSlashMenuState()
  }

  const { $from } = selection
  const textBefore = $from.parent.textBetween(
    0,
    $from.parentOffset,
    undefined,
    "\ufffc"
  )
  const match = /(?:^|\s)\/([a-z0-9-]*)$/i.exec(textBefore)
  if (!match) {
    return createSlashMenuState()
  }

  const query = match[1] || ""
  const slashOffset = textBefore.lastIndexOf(`/${query}`)
  if (slashOffset < 0) {
    return createSlashMenuState()
  }

  const from = $from.start() + slashOffset
  const to = selection.from
  const coords = view.coordsAtPos(selection.from)
  const rect = container.getBoundingClientRect()

  return {
    open: true,
    query,
    top: coords.bottom - rect.top + 8,
    left: coords.left - rect.left,
    range: { from, to },
  }
}

function EditorToolbar({
  editor,
  disabled,
  className,
}: {
  editor: Editor
  disabled: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-w-max items-center gap-1 sm:min-w-0 sm:flex-wrap",
        className
      )}
    >
      <ToolbarButton
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
        disabled={disabled}
      >
        <IconBold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
        disabled={disabled}
      >
        <IconUnderline className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive("heading", { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
        disabled={disabled}
      >
        <IconH1 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
        disabled={disabled}
      >
        <IconH2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive("heading", { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
        disabled={disabled}
      >
        <IconH3 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
        disabled={disabled}
      >
        <IconList className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered list"
        disabled={disabled}
      >
        <IconListNumbers className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive("taskList")}
        onPressedChange={() => editor.chain().focus().toggleTaskList().run()}
        title="Checklist"
        disabled={disabled}
      >
        <IconChecklist className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive("blockquote")}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        title="Quote"
        disabled={disabled}
      >
        <IconBlockquote className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive("callout")}
        onPressedChange={() => editor.chain().focus().insertCallout({ variant: "note" }).run()}
        title="Callout"
        disabled={disabled}
      >
        <IconMessageCircle className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
        title="Divider"
        disabled={disabled}
      >
        <IconMinus className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onPressedChange={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        title="Table"
        disabled={disabled}
      >
        <IconTable className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive("link")}
        onPressedChange={() => insertLink(editor)}
        title="Link"
        disabled={disabled}
      >
        <IconLink className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onPressedChange={() => insertImage(editor)}
        title="Image"
        disabled={disabled}
      >
        <IconPhoto className="size-4" />
      </ToolbarButton>
    </div>
  )
}

export function DocumentEditor({
  value,
  onChange,
  placeholder,
  readOnly = false,
  embedded = false,
  toolbarMode = "sticky",
  className,
  canvasClassName,
  autoFocus = false,
}: DocumentEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const commands = useMemo(() => buildSlashCommands(), [])
  const [slashMenu, setSlashMenu] = useState<SlashMenuState>(createSlashMenuState())
  const normalizedValue = useMemo(
    () => normalizeRichTextDocument(value, emptyRichTextDocument()),
    [value]
  )

  const editor = useEditor({
    immediatelyRender: false,
    autofocus: autoFocus,
    editable: !readOnly,
    extensions: createRichTextExtensions({
      placeholder: placeholder || "",
      includePlaceholder: !readOnly,
    }),
    editorProps: {
      attributes: {
        class: cn(
          "rxly-document-root focus:outline-none",
          readOnly ? "min-h-0" : "min-h-[28rem]"
        ),
      },
    },
    content: normalizedValue,
    onCreate: ({ editor: instance }) => {
      setSlashMenu(updateSlashMenu(instance, containerRef.current))
    },
    onSelectionUpdate: ({ editor: instance }) => {
      setSlashMenu(updateSlashMenu(instance, containerRef.current))
    },
    onTransaction: ({ editor: instance }) => {
      setSlashMenu(updateSlashMenu(instance, containerRef.current))
    },
    onUpdate: ({ editor: instance }) => {
      onChange?.(instance.getJSON())
    },
  })

  useEffect(() => {
    if (!editor) return

    const current = JSON.stringify(editor.getJSON())
    const next = JSON.stringify(normalizedValue)
    if (current !== next) {
      editor.commands.setContent(normalizedValue, { emitUpdate: false })
    }
  }, [editor, normalizedValue])

  const filteredCommands = commands.filter((command) => {
    const query = slashMenu.query.trim().toLowerCase()
    if (!query) return true
    return (
      command.label.toLowerCase().includes(query) ||
      command.aliases.some((alias) => alias.includes(query))
    )
  })
  const showToolbar = !!editor && !readOnly

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-visible",
        embedded
          ? "rounded-none border-0 bg-transparent shadow-none"
          : "rounded-[1.25rem] border border-border/70 bg-card shadow-sm",
        className
      )}
    >
      {showToolbar ? (
        toolbarMode === "sticky" ? (
          <div className="sticky top-0 z-20 mb-5">
            <div className="overflow-x-auto rounded-xl border border-border/70 bg-background/90 px-3 py-2 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.45)] backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
              <EditorToolbar editor={editor} disabled={readOnly} />
            </div>
          </div>
        ) : (
          <div className="border-b border-border/70 px-3 py-2">
            <EditorToolbar
              editor={editor}
              disabled={readOnly}
              className="flex-wrap"
            />
          </div>
        )
      ) : null}
      <div
        className={cn(
          embedded
            ? "bg-transparent px-0 py-0"
            : "bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.92))] px-6 py-7 dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.92),rgba(15,23,42,0.92))] sm:px-8 sm:py-8",
          canvasClassName
        )}
      >
        <EditorContent editor={editor} />
      </div>

      {!readOnly && slashMenu.open && slashMenu.range && filteredCommands.length > 0 ? (
        <div
          className="absolute z-30 w-56 overflow-hidden rounded-xl border border-border/80 bg-popover shadow-xl"
          style={{
            top: slashMenu.top,
            left: Math.min(slashMenu.left, 320),
          }}
        >
          <div className="border-b border-border/70 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Commands
          </div>
          <div className="max-h-72 overflow-y-auto p-1.5">
            {filteredCommands.map((command) => (
              <button
                key={command.key}
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted"
                onMouseDown={(event) => {
                  event.preventDefault()
                  if (!editor) return
                  command.run(editor, slashMenu.range!)
                  setSlashMenu(createSlashMenuState())
                }}
              >
                <span className="font-medium text-foreground">{command.label}</span>
                <span className="text-[11px] text-muted-foreground">
                  /{command.aliases[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function DocumentRenderer({
  value,
  embedded = true,
  className,
  canvasClassName,
}: {
  value: RichTextDocument | null | undefined
  embedded?: boolean
  className?: string
  canvasClassName?: string
}) {
  return (
    <DocumentEditor
      value={value}
      readOnly
      embedded={embedded}
      className={className}
      canvasClassName={canvasClassName}
    />
  )
}
