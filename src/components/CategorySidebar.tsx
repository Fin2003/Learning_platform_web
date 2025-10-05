import React, { useState, useEffect, useRef, Fragment } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./ui/collapsible"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { 
  ChevronDown, 
  ChevronRight,
  ChevronLeft,
  Code,
  BookOpen,
  Rocket,
  Heart,
  GripVertical,
  Plus
} from "lucide-react"

interface Category {
  name: string
  count: number
  icon: string
}

interface SubCategory {
  name: string
  count: number
}

interface CategoryGroup {
  name: string
  icon: React.ComponentType<{ className?: string }>
  categories: (Category | SubCategory)[]
}

const initialCategoryData: CategoryGroup[] = [
  {
    name: "技术分享",
    icon: Code,
    categories: [
      { name: "前端开发", count: 23 },
      { name: "后端开发", count: 15 },
      { name: "数据库", count: 8 },
      { name: "DevOps", count: 12 }
    ]
  },
  {
    name: "学习笔记",
    icon: BookOpen,
    categories: [
      { name: "算法学习", count: 18 },
      { name: "框架学习", count: 25 },
      { name: "工具使用", count: 16 },
      { name: "最佳实践", count: 9 }
    ]
  },
  {
    name: "项目经验",
    icon: Rocket,
    categories: [
      { name: "个人项目", count: 7 },
      { name: "开源贡献", count: 3 },
      { name: "团队协作", count: 12 },
      { name: "问题解决", count: 21 }
    ]
  }
]

export function CategorySidebar({ isCollapsed, onToggle }: { isCollapsed: boolean, onToggle: () => void }) {
  const [groups, setGroups] = useState<CategoryGroup[]>(initialCategoryData)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [isEdit, setIsEdit] = useState(false)
  const longPressDelayMs = 500
  const availableIcons: Array<{name: string, icon: CategoryGroup['icon']}> = [
    { name: 'Code', icon: Code },
    { name: 'BookOpen', icon: BookOpen },
    { name: 'Rocket', icon: Rocket },
    { name: 'Heart', icon: Heart },
  ]
  const [showAddGroupPanel, setShowAddGroupPanel] = useState(false)
  const [pendingGroupIcon, setPendingGroupIcon] = useState<CategoryGroup['icon']>(Code)

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const startLongPress = (targetKey: string) => {
    clearLongPress()
    longPressTimerRef.current = setTimeout(() => {
      setEditTarget(targetKey)
      setIsEdit(true)
    }, longPressDelayMs)
  }

  const cancelEditIfAny = () => setEditTarget(null)
  const exitEdit = () => { setIsEdit(false); setEditTarget(null) }
  const handleToggle = () => {
    if (!isCollapsed) {
      // 如果当前是展开状态，点击收起
      setTextOpacity(0) // 开始淡出
      // 延迟0.2秒后真正收起
      setTimeout(() => {
        setShowText(false)
        onToggle()
      }, 200)
    } else {
      // 如果当前是收起状态，直接展开
      onToggle()
    }
  }
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["技术分享", "学习笔记"]))
  const [showText, setShowText] = useState(!isCollapsed)
  const [textOpacity, setTextOpacity] = useState(!isCollapsed ? 1 : 0)

  useEffect(() => {
    if (!isCollapsed) {
      // 展开时，延迟0.2秒显示文字
      const timer = setTimeout(() => {
        setShowText(true)
        // 使用setTimeout确保DOM更新后再设置透明度
        setTimeout(() => {
          setTextOpacity(1) // 开始淡入
        }, 10)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isCollapsed])





  const toggleGroup = (groupName: string) => {
    const newOpenGroups = new Set(openGroups)
    if (newOpenGroups.has(groupName)) {
      newOpenGroups.delete(groupName)
    } else {
      newOpenGroups.add(groupName)
    }
    setOpenGroups(newOpenGroups)
  }

  // Drag and drop
  type DragPayload = { type: 'group'; gIndex: number } | { type: 'sub'; gIndex: number; sIndex: number }
  const dragItemRef = useRef<DragPayload | null>(null)
  const [dragOver, setDragOver] = useState<null | { gIndex: number; sIndex: number; position: 'before' | 'after' }>(null)
  const [dragOverGroup, setDragOverGroup] = useState<null | { index: number; position: 'before' | 'after' }>(null)
  const onDragStart = (payload: DragPayload) => (e: React.DragEvent) => {
    if (!isEdit) { e.preventDefault(); return }
    dragItemRef.current = payload
    e.dataTransfer.effectAllowed = 'move'
    // Some browsers require data to start a drag
    try { e.dataTransfer.setData('text/plain', JSON.stringify(payload)) } catch {}
  }
  const onDragOver = (e: React.DragEvent) => { if (isEdit) e.preventDefault() }
  const onDragOverSubHover = (gIndex: number, sIndex: number) => (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEdit) return
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const position: 'before' | 'after' = e.clientY < midY ? 'before' : 'after'
    setDragOver({ gIndex, sIndex, position })
  }
  const onDragEnterSub = (gIndex: number, sIndex: number) => (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEdit) return
    e.preventDefault()
    e.stopPropagation()
    // initialize placeholder on enter to this row (position decided by next over)
    setDragOver({ gIndex, sIndex, position: 'before' })
  }
  const clearDragState = () => { dragItemRef.current = null; setDragOver(null) }
  const onDropGroup = (toG: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!isEdit || !dragItemRef.current) return
    const payload = dragItemRef.current
    if (payload.type === 'group') {
      // prefer global placeholder if present
      let insertIndex = dragOverGroup ? (dragOverGroup.position === 'after' ? dragOverGroup.index + 1 : dragOverGroup.index) : toG
      const fromG = payload.gIndex
      const next = [...groups]
      const [moved] = next.splice(fromG, 1)
      if (fromG < insertIndex) insertIndex -= 1
      if (insertIndex < 0) insertIndex = 0
      if (insertIndex > next.length) insertIndex = next.length
      next.splice(insertIndex, 0, moved)
      setGroups(next)
    } else if (payload.type === 'sub') {
      // Move entire subitem to end of target group
      const next = [...groups]
      const fromList = [...next[payload.gIndex].categories]
      const [moved] = fromList.splice(payload.sIndex, 1)
      next[payload.gIndex].categories = fromList
      const toList = [...next[toG].categories]
      toList.push(moved)
      next[toG].categories = toList
      setGroups(next)
    }
    clearDragState(); setDragOverGroup(null)
  }
  const onDragOverGroupHover = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEdit) return
    e.preventDefault(); e.stopPropagation()
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const position: 'before' | 'after' = e.clientY < midY ? 'before' : 'after'
    setDragOverGroup({ index, position })
  }
  const onDragEnterGroup = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEdit) return
    e.preventDefault(); e.stopPropagation()
    setDragOverGroup({ index, position: 'before' })
  }
  const onGroupListOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEdit) return
    e.preventDefault()
    // if near bottom, show end placeholder
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const threshold = 12
    if (e.clientY > rect.bottom - threshold || groups.length === 0) {
      setDragOverGroup({ index: groups.length - 1, position: 'after' })
    }
  }
  const onGroupListDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEdit || !dragItemRef.current) return
    e.preventDefault(); e.stopPropagation()
    const payload = dragItemRef.current
    if (payload.type === 'group') {
      let insertIndex = dragOverGroup ? (dragOverGroup.position === 'after' ? dragOverGroup.index + 1 : dragOverGroup.index) : groups.length
      const fromG = payload.gIndex
      const next = [...groups]
      const [moved] = next.splice(fromG, 1)
      if (fromG < insertIndex) insertIndex -= 1
      if (insertIndex < 0) insertIndex = 0
      if (insertIndex > next.length) insertIndex = next.length
      next.splice(insertIndex, 0, moved)
      setGroups(next)
    }
    clearDragState(); setDragOverGroup(null)
  }
  const moveSub = (fromG: number, fromS: number, toG: number, insertIndex: number) => {
    const next = [...groups]
    const fromList = [...next[fromG].categories]
    const [moved] = fromList.splice(fromS, 1)
    next[fromG].categories = fromList
    const toList = [...next[toG].categories]
    // adjust index if moving within same group and removing earlier index
    const adjustedIndex = fromG === toG && fromS < insertIndex ? insertIndex - 1 : insertIndex
    toList.splice(adjustedIndex, 0, moved)
    next[toG].categories = toList
    setGroups(next)
  }
  const onDropAtIndex = (toG: number, insertIndex: number) => (e: React.DragEvent) => {
    e.preventDefault()
    if (!isEdit || !dragItemRef.current) return
    const payload = dragItemRef.current
    if (payload.type === 'sub') {
      moveSub(payload.gIndex, payload.sIndex, toG, insertIndex)
    }
    clearDragState()
  }
  const onDropSub = (toG: number, toS: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!isEdit || !dragItemRef.current) return
    const payload = dragItemRef.current
    if (payload.type === 'sub') {
      // compute before/after based on pointer position relative to the hovered row
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      const position: 'before' | 'after' = e.clientY < midY ? 'before' : 'after'
      let insertIndex = toS + (position === 'after' ? 1 : 0)
      moveSub(payload.gIndex, payload.sIndex, toG, insertIndex)
    }
    clearDragState()
  }
  const onDragEnd = () => { clearDragState() }

  const addSubItem = (gIndex: number) => {
    const next = [...groups]
    next[gIndex].categories = [...next[gIndex].categories, { name: '新子项', count: 0 }]
    setGroups(next)
  }
  const addGroup = () => {
    const IconComp = pendingGroupIcon
    const next = [...groups, { name: '新主项', icon: IconComp, categories: [] }]
    setGroups(next)
    setShowAddGroupPanel(false)
  }

  return (
    <div className={`bg-background border-r transition-all duration-300 min-h-screen ${isCollapsed ? 'w-20' : 'w-56'}`}>
      <div className="px-0 py-10 min-h-screen">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className={`mb-4 ${isCollapsed ? 'w-full justify-center p-0 h-12' : 'w-full justify-start'} hover:bg-muted bg-transparent`}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4 mr-2" />
          )}
          {showText && <span style={{opacity: textOpacity, transition: 'opacity 0.2s ease-in-out'}}>收起</span>}
        </Button>

        {showText && (
          <div className="space-y-2" style={{opacity: textOpacity, transition: 'opacity 0.2s ease-in-out'}} onDragOver={onGroupListOver} onDrop={onGroupListDrop}>
            {groups.map((group, gIndex) => (
              <Collapsible key={group.name}>
                {dragOverGroup && dragOverGroup.index === gIndex && dragOverGroup.position === 'before' && (
                  <div className="w-full h-8 rounded border-2 border-dashed border-primary bg-primary/5" />
                )}
                <CollapsibleTrigger
                  onClick={() => toggleGroup(group.name)}
                  onMouseDown={(e) => { if (e.button === 0) startLongPress(group.name) }}
                  onMouseUp={() => clearLongPress()}
                  onMouseLeave={() => { clearLongPress(); /* keep edit mode if already set */ }}
                  className={`w-full text-left hover:bg-muted bg-transparent relative ${isEdit ? 'cursor-grab' : ''}`}
                  draggable={isEdit}
                  onDragStart={onDragStart({ type: 'group', gIndex })}
                  onDragEnter={onDragEnterGroup(gIndex)}
                  onDragOver={onDragOverGroupHover(gIndex)}
                  onDrop={onDropGroup(gIndex)}
                >
                  <div className={`flex items-center space-x-2 overflow-hidden ${isEdit ? 'animate-[wiggle_0.6s_ease-in-out_infinite]' : ''}`}>
                    {isEdit && <GripVertical className="h-3 w-3 text-muted-foreground flex-none" />}
                    <group.icon className="h-4 w-4 text-foreground" />
                    <span
                      className={`font-medium text-foreground whitespace-nowrap transform-gpu transition-all duration-300 ${
                        textOpacity === 1 ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0'
                      }`}
                    >
                      {group.name}
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    {openGroups.has(group.name) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* action buttons removed per request; edit exit remains below */}
                </CollapsibleTrigger>
                {dragOverGroup && dragOverGroup.index === gIndex && dragOverGroup.position === 'after' && (
                  <div className="w-full h-8 rounded border-2 border-dashed border-primary bg-primary/5" />
                )}
                <CollapsibleContent isOpen={openGroups.has(group.name)}>
                  <div
                    className="ml-6 space-y-1 mt-2 overflow-hidden"
                    onDragOver={(e) => {
                      if (!isEdit) return
                      e.preventDefault()
                      // 仅当接近容器底部时，才在末尾显示占位，避免覆盖行级占位
                      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                      const threshold = 12
                      if (e.clientY > rect.bottom - threshold || group.categories.length === 0) {
                        setDragOver({ gIndex, sIndex: group.categories.length, position: 'after' })
                      }
                    }}
                    onDrop={(e) => {
                      if (!isEdit || !dragItemRef.current) return
                      e.preventDefault()
                      e.stopPropagation()
                      const payload = dragItemRef.current
                      if (payload.type === 'sub') {
                        const insertIndex = dragOver && dragOver.gIndex === gIndex ? (dragOver.position === 'after' ? dragOver.sIndex + 1 : dragOver.sIndex) : group.categories.length
                        moveSub(payload.gIndex, payload.sIndex, gIndex, insertIndex)
                      }
                      clearDragState()
                    }}
                    onDragLeave={() => {
                      // 离开容器时不强制末尾占位，交由行级事件控制
                      // 仅当当前占位是末尾占位时清掉
                      setDragOver((prev) => {
                        if (prev && prev.gIndex === gIndex && prev.sIndex === group.categories.length) {
                          return null
                        }
                        return prev
                      })
                    }}
                  >
                    {group.categories.map((category, sIndex) => (
                      <Fragment key={`frag-${group.name}-${sIndex}`}>
                        {dragOver && dragOver.gIndex === gIndex && dragOver.sIndex === sIndex && dragOver.position === 'before' && (
                          <div key={`${group.name}-placeholder-before-${sIndex}`} className="w-full h-8 rounded border-2 border-dashed border-primary bg-primary/5" />
                        )}
                        <div
                          key={`${group.name}-${category.name}-${sIndex}`}
                          className={`flex items-center justify-between p-2 rounded hover:bg-muted transition-colors ${isEdit ? 'cursor-grab' : 'cursor-pointer'}`}
                          onMouseDown={(e) => { if (e.button === 0) startLongPress(`${group.name}:${sIndex}`) }}
                          onMouseUp={() => clearLongPress()}
                          onMouseLeave={() => clearLongPress()}
                          draggable={isEdit}
                          onDragStart={onDragStart({ type: 'sub', gIndex, sIndex })}
                          onDragOver={onDragOverSubHover(gIndex, sIndex)}
                          onDragEnter={onDragEnterSub(gIndex, sIndex)}
                          onDrop={onDropSub(gIndex, sIndex)}
                          onDragEnd={onDragEnd}
                        >
                          <div className={`flex items-center gap-2 min-w-0 ${isEdit ? 'animate-[wiggle_0.6s_ease-in-out_infinite]' : ''}`}>
                            {isEdit && <GripVertical className="h-3 w-3 text-muted-foreground flex-none" />}
                            <span
                              className={`text-sm text-foreground whitespace-nowrap transform-gpu transition-all duration-300 ${
                                textOpacity === 1 ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0'
                              }`}
                            >
                              {category.name}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs flex-none">
                            {category.count}
                          </Badge>
                        </div>
                        {dragOver && dragOver.gIndex === gIndex && dragOver.sIndex === sIndex && dragOver.position === 'after' && (
                          <div key={`${group.name}-placeholder-after-${sIndex}`} className="w-full h-8 rounded border-2 border-dashed border-primary bg-primary/5" />
                        )}
                      </Fragment>
                    ))}
                    {dragOver && dragOver.gIndex === gIndex && dragOver.sIndex === group.categories.length && dragOver.position === 'after' && (
                      <div className="w-full h-8 rounded border-2 border-dashed border-primary bg-primary/5" />
                    )}
                    {isEdit && (
                      <div className="pl-2 pt-1">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); addSubItem(gIndex) }} className="flex items-center gap-2">
                          <Plus className="h-4 w-4" /> 新增子项
                        </Button>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
            {isEdit && (
              <div className="mt-3 px-2">
                {!showAddGroupPanel ? (
                  <Button size="sm" variant="ghost" onClick={() => setShowAddGroupPanel(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> 新增主项
                  </Button>
                ) : (
                  <div className="p-2 border border-border rounded-md space-y-2">
                    <div className="text-sm text-muted-foreground">选择图标</div>
                    <div className="flex items-center gap-2">
                      {availableIcons.map((opt, idx) => (
                        <button key={idx} className={`p-2 rounded-md border ${pendingGroupIcon === opt.icon ? 'border-primary' : 'border-border'}`} onClick={() => setPendingGroupIcon(opt.icon)}>
                          <opt.icon className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={addGroup}>确定</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddGroupPanel(false)}>取消</Button>
                    </div>
                  </div>
                )}
                <div className="mt-2">
                  <Button size="sm" variant="outline" onClick={exitEdit}>退出编辑</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {isCollapsed && (
          <div className="space-y-2">
            {groups.map((group) => (
              <Button
                key={group.name}
                variant="ghost"
                size="sm"
                className="w-full justify-center p-0 h-12 hover:bg-muted bg-transparent"
                title={group.name}
              >
                <group.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
