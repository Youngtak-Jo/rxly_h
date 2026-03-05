/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/documents/document-builder-step-structure.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const svpStart = content.indexOf('function SampleValuePanel(');
const svpEnd = content.indexOf('function SectionToggle(');

const newComponents = `
function getActiveNodeByPath(nodes: DocumentSchemaNode[], pathId: string | null): { node: DocumentSchemaNode, path: number[] } | null {
  if (!pathId) return null;
  const path = pathId.split('.').map(Number);
  let currentNodes = nodes;
  let targetNode: DocumentSchemaNode | null = null;
  for (let i = 0; i < path.length; i++) {
    const idx = path[i];
    if (!currentNodes[idx]) return null;
    targetNode = currentNodes[idx];
    if (i < path.length - 1 && 'children' in targetNode) {
      if (!Array.isArray(targetNode.children)) return null;
      currentNodes = targetNode.children;
    } else if (i < path.length - 1) {
      return null;
    }
  }
  if (!targetNode) return null;
  return { node: targetNode, path };
}

function CanvasBlockEditor({
  node,
  path,
  depth,
  siblingCount,
  activeNodePathId,
  onSetActiveNode,
  onUpdateNode,
  onRemoveNode,
  onMoveNode,
  onAddChild,
}: {
  node: DocumentSchemaNode
  path: number[]
  depth: number
  siblingCount: number
  activeNodePathId: string | null
  onSetActiveNode: (pathId: string) => void
  onUpdateNode: (
    path: number[],
    updater: (node: DocumentSchemaNode) => DocumentSchemaNode
  ) => void
  onRemoveNode: (path: number[]) => void
  onMoveNode: (path: number[], direction: "up" | "down") => void
  onAddChild: (path: number[], type: DocumentSchemaNodeType) => void
}) {
  const t = useTranslations("DocumentBuilder")
  const pathId = toNodePathId(path)
  const isActive = activeNodePathId === pathId
  const isGroup = node.type === "group" || node.type === "repeatableGroup"
  const nodeTitle = node.label || humanizeKey(node.key) || "Unlabeled Field"

  return (
    <div
      className={cn(
        "group/block relative rounded-xl border transition-all duration-200 ease-out",
        isActive 
          ? "border-primary/50 bg-primary/5 ring-4 ring-primary/10 shadow-sm z-10" 
          : "border-border/60 bg-card hover:border-border/80 hover:bg-muted/10 shadow-sm"
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSetActiveNode(pathId)
      }}
    >
      <div className={cn(
        "absolute -right-3 -top-3 z-20 flex shrink-0 items-center gap-1 rounded-full border border-border/80 bg-background p-1 shadow-md transition-all duration-200",
        isActive ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover/block:opacity-100 group-hover/block:scale-100"
      )}>
        <CompactActionButton
          label={t("schemaNode.actions.moveUp")}
          disabled={path[path.length - 1] === 0}
          onClick={(e) => { e.stopPropagation(); onMoveNode(path, "up") }}
        >
          <IconArrowUp className="size-3.5" />
        </CompactActionButton>
        <CompactActionButton
          label={t("schemaNode.actions.moveDown")}
          disabled={path[path.length - 1] >= siblingCount - 1}
          onClick={(e) => { e.stopPropagation(); onMoveNode(path, "down") }}
        >
          <IconArrowDown className="size-3.5" />
        </CompactActionButton>
        <CompactActionButton
          label={t("schemaNode.actions.delete")}
          destructive
          onClick={(e) => { e.stopPropagation(); onRemoveNode(path) }}
        >
          <IconTrash className="size-3.5" />
        </CompactActionButton>
      </div>

      <div className="p-4 sm:p-5">
        {isGroup ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="flex flex-wrap items-center gap-2 text-base font-semibold text-foreground">
                {nodeTitle}
                {node.type === "repeatableGroup" && (
                   <span className="rounded-md bg-muted border border-border/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("schemaNode.types.repeatableGroup")}</span>
                )}
                {node.required && <span className="text-destructive font-bold">*</span>}
              </label>
              {node.helpText && <p className="text-sm text-muted-foreground leading-relaxed">{node.helpText}</p>}
            </div>
            
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 min-h-24">
               {node.children.length === 0 ? (
                 <div className="py-2 text-center text-sm text-muted-foreground/70">
                   {t("schemaNode.noChildren")}
                 </div>
               ) : (
                 <div className="space-y-3">
                   {node.children.map((child, index) => (
                     <CanvasBlockEditor
                       key={\`\${pathId}-\${child.key}-\${index}\`}
                       node={child}
                       path={[...path, index]}
                       depth={depth + 1}
                       siblingCount={node.children.length}
                       activeNodePathId={activeNodePathId}
                       onSetActiveNode={onSetActiveNode}
                       onUpdateNode={onUpdateNode}
                       onRemoveNode={onRemoveNode}
                       onMoveNode={onMoveNode}
                       onAddChild={onAddChild}
                     />
                   ))}
                 </div>
               )}
               <div className="mt-4 flex flex-wrap justify-center gap-2 opacity-0 group-hover/block:opacity-100 transition-opacity focus-within:opacity-100" onClick={(e) => e.stopPropagation()}>
                 <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 rounded-full border-dashed bg-background shadow-xs text-muted-foreground hover:text-foreground hover:border-solid hover:bg-muted/50"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddChild(path, "shortText")
                      onSetActiveNode(toNodePathId([...path, node.children.length]))
                    }}
                 >
                    <IconPlus className="size-3.5" />
                    {t("schemaEditor.addField")}
                 </Button>
                 <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 rounded-full border-dashed bg-background shadow-xs text-muted-foreground hover:text-foreground hover:border-solid hover:bg-muted/50"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddChild(path, "group")
                      onSetActiveNode(toNodePathId([...path, node.children.length]))
                    }}
                 >
                    <IconPlus className="size-3.5" />
                    {t("schemaEditor.addGroup")}
                 </Button>
               </div>
            </div>
          </div>
        ) : (
          <div className="pointer-events-none space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              {nodeTitle}
              {node.required && <span className="text-destructive font-bold">*</span>}
              <span className="rounded-md bg-muted/80 border border-border/50 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                 {node.type === "shortText" ? t("schemaNode.types.shortText") : node.type === "longText" ? t("schemaNode.types.longText") : t("schemaNode.types.stringList")}
              </span>
            </label>
            {node.helpText && <p className="text-xs text-muted-foreground">{node.helpText}</p>}
            {node.type === "shortText" ? (
               <Input readOnly placeholder={node.placeholder ? node.placeholder : "..."} className="h-10 bg-background/60 shadow-none border-border/60 transition-colors" tabIndex={-1} />
            ) : node.type === "longText" ? (
               <Textarea readOnly placeholder={node.placeholder ? node.placeholder : "..."} className="min-h-[100px] resize-none bg-background/60 shadow-none border-border/60 transition-colors" tabIndex={-1} />
            ) : (
               <Textarea readOnly placeholder={node.placeholder ? node.placeholder : "Item 1\\nItem 2..."} className="min-h-[100px] resize-none bg-background/60 shadow-none border-border/60 transition-colors" tabIndex={-1} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
`;

content = content.substring(0, svpStart) + newComponents + content.substring(svpEnd);


const oldState = `  const t = useTranslations("DocumentBuilder")
  const [expandedNodeIds, setExpandedNodeIds] = useState<string[]>([])
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [advancedPanelOpen, setAdvancedPanelOpen] = useState(false)
  const [repeatableGroupActiveItem, setRepeatableGroupActiveItem] = useState<
    Record<string, number>
  >({})

  const updateNodes = (`;

const newState = `  const t = useTranslations("DocumentBuilder")
  const [activeNodePathId, setActiveNodePathId] = useState<string | null>(null)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [advancedPanelOpen, setAdvancedPanelOpen] = useState(false)

  const activeNodeData = getActiveNodeByPath(draft.schema.nodes, activeNodePathId)

  const updateNodes = (`;

content = content.replace(oldState, newState);

const oldFunctions = `  const toggleExpanded = (pathId: string) => {
    setExpandedNodeIds((current) =>
      current.includes(pathId)
        ? current.filter((id) => id !== pathId)
        : [...current, pathId]
    )
  }

  const expandNode = (pathId: string) => {
    setExpandedNodeIds((current) =>
      current.includes(pathId) ? current : [...current, pathId]
    )
  }`;

content = content.replace(oldFunctions, '');


const layoutOld = `<div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">`;

const layoutNew = `<div className="flex h-full min-h-0 flex-1 overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth sm:px-6 sm:py-6" onClick={() => setActiveNodePathId(null)}>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6" onClick={(e) => e.stopPropagation()}>`;

content = content.replace(layoutOld, layoutNew);

const schemaEditorStartStr = '<section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">\n          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">\n            <div className="space-y-1.5">\n              <h2 className="text-lg font-semibold">{t("schemaEditor.title")}</h2>';
const parts = content.split(schemaEditorStartStr);
if (parts.length === 2) {
  const schemaEditorNew = `        <section className="mt-4 border-t border-border/40 pt-8 pb-12">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold">{t("schemaEditor.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("schemaEditor.canvasDescription")}
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-border/40 bg-muted/10 p-4 sm:p-6 shadow-sm">
            {draft.schema.nodes.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border/60 bg-card px-4 py-20 text-center transition-colors hover:border-primary/30">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted shadow-sm">
                   <IconPlus className="size-6 text-foreground/70" />
                </div>
                <h3 className="text-base font-semibold">{t("schemaEditor.empty")}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">Click below to add fields and start building your document template graphically.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 h-10 px-5 rounded-full shadow-sm"
                    onClick={() => {
                      updateNodes((nodes) => [...nodes, createNode("shortText")])
                      setActiveNodePathId(toNodePathId([draft.schema.nodes.length]))
                    }}
                  >
                    <IconPlus className="size-4" />
                    {t("schemaEditor.addField")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 h-10 px-5 rounded-full shadow-sm"
                    onClick={() => {
                      updateNodes((nodes) => [...nodes, createNode("group")])
                      setActiveNodePathId(toNodePathId([draft.schema.nodes.length]))
                    }}
                  >
                    <IconPlus className="size-4" />
                    {t("schemaEditor.addGroup")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 relative">
                <div className="absolute -left-3 -right-3 -top-3 -bottom-3 border border-border/0 rounded-[28px] pointer-events-none"></div>
                {draft.schema.nodes.map((node, index) => (
                  <CanvasBlockEditor
                    key={\`\${node.key}-\${index}\`}
                    node={node}
                    path={[index]}
                    depth={0}
                    siblingCount={draft.schema.nodes.length}
                    activeNodePathId={activeNodePathId}
                    onSetActiveNode={setActiveNodePathId}
                    onUpdateNode={(nodePath, updater) =>
                      updateNodes((nodes) => updateNodeAtPath(nodes, nodePath, updater))
                    }
                    onRemoveNode={(nodePath) => {
                      updateNodes((nodes) => removeNodeAtPath(nodes, nodePath))
                      if (activeNodePathId && activeNodePathId.startsWith(toNodePathId(nodePath))) {
                        setActiveNodePathId(null)
                      }
                    }}
                    onMoveNode={(nodePath, direction) =>
                      updateNodes((nodes) => moveNodeAtPath(nodes, nodePath, direction))
                    }
                    onAddChild={(nodePath, type) =>
                      updateNodes((nodes) =>
                        appendChildAtPath(nodes, nodePath, createNode(type))
                      )
                    }
                  />
                ))}
                
                <div className="mt-6 pt-4 flex justify-center gap-3 relative z-10">
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2 rounded-full h-10 px-5 bg-background shadow-sm border border-border/50 hover:border-border/80"
                    onClick={() => {
                      updateNodes((nodes) => [...nodes, createNode("shortText")])
                      setActiveNodePathId(toNodePathId([draft.schema.nodes.length]))
                    }}
                  >
                    <IconPlus className="size-4" />
                    {t("schemaEditor.addField")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2 rounded-full h-10 px-5 bg-background shadow-sm border border-border/50 hover:border-border/80"
                    onClick={() => {
                      updateNodes((nodes) => [...nodes, createNode("group")])
                      setActiveNodePathId(toNodePathId([draft.schema.nodes.length]))
                    }}
                  >
                    <IconPlus className="size-4" />
                    {t("schemaEditor.addGroup")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
        </div>
      </div>
      
      {/* Sidebar Inspector */}
      <div className="w-[340px] shrink-0 overflow-y-auto border-l border-border bg-card shadow-[-8px_0_24px_-12px_rgba(0,0,0,0.05)] z-20 xl:w-[400px]">
         <div className="sticky top-0 z-10 flex min-h-[60px] items-center border-b border-border/60 bg-card/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">{t("schemaEditor.inspectorTitle") || "Field Properties"}</h3>
         </div>
         <div className="p-5">
           {activeNodeData ? (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300 ease-out">
               <NodeDetailsPanel 
                 node={activeNodeData.node} 
                 path={activeNodeData.path}
                 onUpdate={(nodePath, updater) => {
                   updateNodes((nodes) => updateNodeAtPath(nodes, nodePath, updater))
                 }}
               />
             </div>
           ) : (
             <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center text-muted-foreground animate-in fade-in duration-500">
               <div className="rounded-full bg-muted/60 p-4 ring-1 ring-border/50 shadow-inner">
                  <IconSparkles className="size-6 text-muted-foreground/50" />
               </div>
               <div>
                  <p className="text-sm font-medium text-foreground/80">{t("schemaEditor.selectNodeToEdit") || "Select a field"}</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">Click on any block in the canvas to edit its properties here</p>
               </div>
             </div>
           )}
         </div>
      </div>
    </div>
  )
}
`;
  content = parts[0] + schemaEditorNew;
}

// Update NodeDetailsPanel layout for sidebar
content = content.replace(/className="grid gap-4 md:grid-cols-2"/g, 'className="flex flex-col gap-5"');
content = content.replace(/className="space-y-2 md:col-span-2"/g, 'className="space-y-2"');
content = content.replace('<div className="rounded-2xl border border-border/70 bg-muted/15 p-4">', '<div className="flex flex-col gap-1 w-full overflow-hidden">');

fs.writeFileSync(filePath, content);
console.log('Successfully updated component!');
