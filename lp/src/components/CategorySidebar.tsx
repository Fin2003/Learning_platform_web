import React, { useState, useEffect, useRef, useMemo } from "react"
import { AnimatePresence, motion, LayoutGroup } from "framer-motion"
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
  Trash2,
  Plus
} from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { IconButton } from "./ui/shadcn-io/icon-button"
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
  MeasuringStrategy,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// 回收站展开动画：从右下角圆形扩展到矩形
const trashVariants: any = {
  // 在面板自身范围内做裁剪动画，圆心定位在面板右下角（100% 100%）
  open: (r: number = 1200) => ({
    clipPath: `circle(${r}px at 100% 100%)`,
    transition: { duration: 1, ease: [.64,.18,.47,.98] },
  }),  
  closed: {
    clipPath: 'circle(0px at 100% 100%)',
    transition: { duration: 1, ease: [.19,-0.01,0,.98] },
  }
}

// 圆形按钮的三条线动画（MenuToggle 风格）
// const IconPath = (props: any) => (
//   <motion.path fill="transparent" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" {...props} />
// )

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
      { name: "数据结构", count: 14 },
      { name: "系统设计", count: 9 },
      { name: "面试准备", count: 22 }
    ]
  },
  {
    name: "项目经验",
    icon: Rocket,
    categories: [
      { name: "个人项目", count: 6 },
      { name: "开源贡献", count: 4 },
      { name: "团队协作", count: 11 },
      { name: "技术分享", count: 7 }
    ]
  },
  {
    name: "生活分享",
    icon: Heart,
    categories: [
      { name: "日常记录", count: 35 },
      { name: "旅行见闻", count: 12 },
      { name: "读书心得", count: 18 },
      { name: "生活感悟", count: 25 }
    ]
  }
]

// Sortable Sub Item Component
const SortableSubItem = ({ category, gIndex, sIndex, isEdit, isEditAnimating, activeId, overId, isStaged, onToggleSelect, editingSubId, editingSubText, onEditingChange, onCommitEdit, startLongPress, clearLongPress }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSubDragging,
  } = useSortable({ 
    id: `sub-${gIndex}-${sIndex}`,
    // 禁用布局变化动画，防止放下后出现“飞回去”的效果
    animateLayoutChanges: () => false,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition, // 使用 @dnd-kit 的默认过渡
    // 确保动画流畅
    willChange: transform ? 'transform' : 'auto',
  }

  // 调试动画信息
  if (transform) {
    console.log(`SubItem ${gIndex}-${sIndex} transform:`, transform, 'transition:', transition, 'isDragging:', isSubDragging)
  }

  const isActive = activeId === `sub-${gIndex}-${sIndex}`
  const isOver = overId === `sub-${gIndex}-${sIndex}`

  const subId = `sub-${gIndex}-${sIndex}`
  const isSelected = isStaged ? isStaged(subId) : false

  const isEditing = isEdit && editingSubId === `sub-${gIndex}-${sIndex}`

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-2 rounded hover:bg-muted transition-colors ${isEdit ? (isEditing ? 'cursor-text' : 'cursor-grab') : 'cursor-pointer'} ${isSubDragging ? 'opacity-30' : ''} ${isActive ? 'ring-2 ring-primary' : ''} ${isOver ? 'bg-primary/10 border-2 border-primary/50' : ''} ${isSelected ? 'opacity-60' : ''}`}
      {...(isEdit && !isSelected && !isEditing ? attributes : {})}
      {...(isEdit && !isSelected && !isEditing ? listeners : {})}
      onMouseDown={() => { if (!isEdit && startLongPress) startLongPress(`sub-${gIndex}-${sIndex}`) }}
      onMouseUp={() => { if (!isEdit && clearLongPress) clearLongPress() }}
      onMouseLeave={() => { if (!isEdit && clearLongPress) clearLongPress() }}
      onTouchStart={() => { if (!isEdit && startLongPress) startLongPress(`sub-${gIndex}-${sIndex}`) }}
      onTouchEnd={() => { if (!isEdit && clearLongPress) clearLongPress() }}
    >
      <motion.div 
        className="flex items-center space-x-2 overflow-hidden"
        layout
        transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
      >
        <motion.div
          className="flex items-center gap-1"
          initial={false}
          animate={{ scaleX: (isEdit || isEditAnimating) && !isEditing ? 1 : 0, opacity: (isEdit || isEditAnimating) && !isEditing ? 1 : 0 }}
          transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
          style={{ transformOrigin: 'left center' }}
        >
        <AnimatePresence>
          {(isEdit || isEditAnimating) && !isEditing && (
            <motion.input
              key={`sub-checkbox-${gIndex}-${sIndex}`}
              type="checkbox"
              className="h-3.5 w-3.5 accent-destructive"
              checked={isSelected}
              onChange={(e) => { e.stopPropagation(); onToggleSelect && onToggleSelect(gIndex, sIndex) }}
              onClick={(e) => e.stopPropagation()}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {(isEdit || isEditAnimating) && !isEditing && (
            <motion.div 
              key={`sub-grip-${gIndex}-${sIndex}`}
              className="cursor-grab p-1 hover:bg-muted rounded"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
            >
              <GripVertical className="h-3 w-3 text-muted-foreground flex-none" />
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
        {isEditing ? (
          <input
            autoFocus
            value={editingSubText}
            onChange={(e) => onEditingChange && onEditingChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onCommitEdit && onCommitEdit(gIndex, sIndex)
              } else if (e.key === 'Escape') {
                onEditingChange && onEditingChange(editingSubText)
                onCommitEdit && onCommitEdit(gIndex, sIndex, true)
              }
            }}
            onBlur={() => onCommitEdit && onCommitEdit(gIndex, sIndex)}
            className="h-7 px-2 rounded border bg-background text-sm min-w-0 w-full outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="输入子项名称，回车保存"
          />
        ) : (
          <span className="text-sm text-foreground whitespace-nowrap truncate min-w-0">
            {category.name}
          </span>
        )}
      </motion.div>
      {!isEditing && (
        <Badge variant="secondary" className="text-xs flex-none">
          {category.count}
        </Badge>
      )}
    </div>
  )
}

// Sortable Sub Items Component
const SortableSubItems = ({ group, gIndex, isEdit, isEditAnimating, activeId, overId, isStaged, onToggleSubSelect, onAddSub, editingSubId, editingSubText, onEditingChange, onCommitEdit, startLongPress, clearLongPress }: any) => {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: `sub-container-${gIndex}`,
  })

  // 生成稳定的 items 数组，确保动画计算正确
  // 使用 useMemo 确保 items 数组在拖拽过程中正确更新
  const items = useMemo(() => 
    group.categories.map((_: any, sIndex: number) => `sub-${gIndex}-${sIndex}`),
    [group.categories, gIndex]
  )

  // 关闭插入位置指示器（移除蓝色横线）
  const getInsertIndicator = () => {
    return null
  }

  return (
    <div
      ref={setNodeRef}
      className={`ml-6 space-y-3 mt-2 overflow-hidden transition-colors duration-200 ${isOver ? 'bg-primary/10 border border-primary/30 rounded-md' : ''}`}
    >
      <AnimatePresence>
        {isEdit && (
          <motion.button
            key={`add-sub-${gIndex}`}
            type="button"
            onClick={() => onAddSub && onAddSub(gIndex)}
            className="w-full border-2 border-dashed border-border rounded-md py-2 px-2 flex items-center justify-start hover:bg-muted/40 transition-colors"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
          >
            <span className="text-xs text-muted-foreground">添加子项（回车保存）</span>
          </motion.button>
        )}
      </AnimatePresence>
      <SortableContext 
        items={items} 
        strategy={verticalListSortingStrategy}
        // 添加 key 确保重新渲染时正确更新
        key={`sub-context-${gIndex}-${items.length}`}
      >
        {group.categories.map((category: any, sIndex: number) => (
          <SortableSubItem
            key={`sub-${gIndex}-${sIndex}`}
            category={category}
            gIndex={gIndex}
            sIndex={sIndex}
            isEdit={isEdit}
            isEditAnimating={isEditAnimating}
            activeId={activeId}
            overId={overId}
            isStaged={isStaged}
            onToggleSelect={onToggleSubSelect}
            editingSubId={editingSubId}
            editingSubText={editingSubText}
            onEditingChange={onEditingChange}
            onCommitEdit={onCommitEdit}
            startLongPress={startLongPress}
            clearLongPress={clearLongPress}
          />
        ))}
        {/* 插入位置指示器 - 放在最后 */}
        {getInsertIndicator()}
      </SortableContext>
    </div>
  )
}


// Sortable Group Component
const SortableGroup = ({ group, gIndex, isEdit, isEditAnimating, openGroups, toggleGroup, startLongPress, clearLongPress, activeId, overId, isStaged, onToggleGroupSelect, onToggleSubSelect, onAddSub, editingSubId, editingSubText, onEditingChange, onCommitEdit }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isGroupDragging,
  } = useSortable({ 
    id: `group-${gIndex}`,
    // 禁用布局变化动画，防止放下后出现“飞回去”的效果
    animateLayoutChanges: () => false,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition, // 使用 @dnd-kit 的默认过渡
  }

  // 调试动画信息
  if (transform) {
    console.log(`Group ${gIndex} transform:`, transform, 'transition:', transition, 'isOpen:', openGroups.has(group.name))
  }

  const isActive = activeId === `group-${gIndex}`

  const groupId = `group-${gIndex}`
  const groupSelected = isStaged ? isStaged(groupId) : false

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 rounded-md transition-colors ${isGroupDragging ? 'opacity-30' : ''} ${isActive ? 'ring-2 ring-primary' : ''} ${overId === `group-${gIndex}` ? 'bg-primary/10 border-2 border-primary/50' : ''} ${groupSelected ? 'opacity-60' : ''}`}
    >
      <div
        className={`flex items-center justify-between w-full ${isEdit ? 'cursor-grab' : 'cursor-pointer'}`}
        onClick={() => { if (!isEdit) toggleGroup(group.name) }}
        onMouseDown={() => { if (!isEdit && startLongPress) startLongPress(`group-${gIndex}`) }}
        onMouseUp={() => { if (!isEdit && clearLongPress) clearLongPress() }}
        onMouseLeave={() => { if (!isEdit && clearLongPress) clearLongPress() }}
        onTouchStart={() => { if (!isEdit && startLongPress) startLongPress(`group-${gIndex}`) }}
        onTouchEnd={() => { if (!isEdit && clearLongPress) clearLongPress() }}
      >
        {/* 左侧：拖拽手柄区域（编辑模式可拖拽） */}
        <motion.div
          className={`flex items-center space-x-2 overflow-hidden ${isEdit ? 'cursor-grab hover:bg-muted/50' : 'hover:bg-muted/30'}`}
          layout
          transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
          {...(isEdit && !groupSelected ? attributes : {})}
          {...(isEdit && !groupSelected ? listeners : {})}
        >
          <motion.div
            className="flex items-center gap-1"
            initial={false}
            animate={{ scaleX: (isEdit || isEditAnimating) ? 1 : 0, opacity: (isEdit || isEditAnimating) ? 1 : 0 }}
            transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
            style={{ transformOrigin: 'left center' }}
          >
         <AnimatePresence>
           {(isEdit || isEditAnimating) && (
             <motion.input
               key="group-checkbox"
               type="checkbox"
               className="h-3.5 w-3.5 accent-destructive"
               checked={groupSelected}
               onChange={(e) => { e.stopPropagation(); onToggleGroupSelect && onToggleGroupSelect(gIndex, groupSelected) }}
               onClick={(e) => e.stopPropagation()}
               initial={{ x: -20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               exit={{ x: -20, opacity: 0 }}
               transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
             />
           )}
         </AnimatePresence>
         <AnimatePresence>
           {(isEdit || isEditAnimating) && (
             <motion.div 
               key="group-grip"
               className="cursor-grab p-1 hover:bg-muted rounded"
               initial={{ x: -20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               exit={{ x: -20, opacity: 0 }}
               transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
             >
               <GripVertical className="h-3 w-3 text-muted-foreground flex-none" />
             </motion.div>
           )}
         </AnimatePresence>
          </motion.div>
          <motion.div
            layoutId={`group-icon-${gIndex}`}
            transition={{ type: "tween", duration: 0.5 as any, ease: [0.38, 0.07, 0.49, 0.94] as any }}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
          >
            <group.icon className="h-4 w-4 text-foreground" />
          </motion.div>
          <span
            className={`font-medium text-foreground whitespace-nowrap transform-gpu transition-all duration-300 ${
              true ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0'
            }`}
          >
            {group.name}
          </span>
        </motion.div>
        {/* 右侧：专用于展开/收起的按钮区域 */}
        <button
          type="button"
          className="ml-auto flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/40"
          onClick={(e) => {
            e.stopPropagation()
            toggleGroup(group.name)
          }}
        >
          {openGroups.has(group.name) ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>
      
      {/* 子项内容：带展开/收起动画 */}
      <AnimatePresence initial={false} mode="sync">
        {openGroups.has(group.name) && (
          <motion.div
            key={`sublist-${gIndex}`}
            className="mt-2 ml-6 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
            onMouseDown={(e) => {
              // 防止在展开区域误启动主项拖拽
              if (isEdit) e.stopPropagation()
            }}
          >
            <SortableSubItems 
              group={group}
              gIndex={gIndex}
              isEdit={isEdit}
              isEditAnimating={isEditAnimating}
              activeId={activeId}
              overId={overId}
              isStaged={isStaged}
              onToggleSubSelect={onToggleSubSelect}
              onAddSub={onAddSub}
              editingSubId={editingSubId}
              editingSubText={editingSubText}
              onEditingChange={onEditingChange}
              onCommitEdit={onCommitEdit}
              startLongPress={startLongPress}
              clearLongPress={clearLongPress}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface CategorySidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export default function CategorySidebar({ isCollapsed, onToggle }: CategorySidebarProps) {
  const [groups, setGroups] = useState<CategoryGroup[]>(initialCategoryData)
  
  // Long press detection
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressDelayMs = 500
  const [isEdit, setIsEdit] = useState(false)
  const [isEditAnimating, setIsEditAnimating] = useState(false)
  
  // Drag state management
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  // 删除投递区
  const { setNodeRef: setTrashRef, isOver: isOverTrash } = useDroppable({ id: 'trash-dropzone' })
  // 删除模式：single | multi
  const [deleteMode, setDeleteMode] = useState<'single' | 'multi'>('single')
  // 多选暂存的被删除项（记忆，不随模式切换清空）
  const [stagedIds, setStagedIds] = useState<string[]>([])
  const [stagedLabels, setStagedLabels] = useState<Record<string, string>>({})
  // 回收站展开/收回（编辑模式下可点击右下角小按钮）
  const [, setTrashOpen] = useState(false)
  const [keepTrashVisible, setKeepTrashVisible] = useState(false)
  // 删除确认框
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMode, setConfirmMode] = useState<'single' | 'multi'>('single')
  const [confirmItems, setConfirmItems] = useState<{ id: string, label: string }[]>([])
  // 未选择提示
  const [showNoSelectionTip, setShowNoSelectionTip] = useState(false)
  const [trashBurst, setTrashBurst] = useState(false)
  const [trashInvert, setTrashInvert] = useState(false)
  const [hasChildrenDialogOpen, setHasChildrenDialogOpen] = useState(false)
  const [hasChildrenGroupName, setHasChildrenGroupName] = useState('')
  // 内联编辑子项状态
  const [editingSubId, setEditingSubId] = useState<string | null>(null)
  const [editingSubText, setEditingSubText] = useState<string>('')
  // 退出编辑时自动收起
  useEffect(() => {
    if (!isEdit) setTrashOpen(false)
  }, [isEdit])

  // 新建主项对话框状态
  const [newGroupOpen, setNewGroupOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupIcon, setNewGroupIcon] = useState<React.ComponentType<{ className?: string }>>(Code)
  const availableIcons: Array<{ key: string, Comp: React.ComponentType<{ className?: string }> }> = [
    { key: 'Code', Comp: Code },
    { key: 'BookOpen', Comp: BookOpen },
    { key: 'Rocket', Comp: Rocket },
    { key: 'Heart', Comp: Heart },
  ]
  const openNewGroupDialog = () => {
    setNewGroupName('')
    setNewGroupIcon(Code)
    // 打开新建主项时，关闭其它弹层
    setConfirmOpen(false)
    setHasChildrenDialogOpen(false)
    setTrashOpen(false)
    setKeepTrashVisible(false)
    setNewGroupOpen(true)
  }
  const confirmCreateGroup = () => {
    const name = newGroupName.trim() || '未命名主项'
    setGroups((items) => [{ name, icon: newGroupIcon, categories: [] }, ...items])
    setOpenGroups((prev) => {
      const next = new Set(prev)
      next.add(name)
      return next
    })
    setNewGroupOpen(false)
  }

  const isStaged = (id: string) => stagedIds.includes(id)
  const stageItem = (id: string, label: string) => {
    setStagedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setStagedLabels((prev) => (prev[id] ? prev : { ...prev, [id]: label }))
  }
  const unstageItem = (id: string) => {
    setStagedIds((prev) => prev.filter((x) => x !== id))
  }

  // 选择框 handlers
  const handleToggleGroupSelect = (gIndex: number, currentlySelected: boolean) => {
    const gid = `group-${gIndex}`
    if (currentlySelected) {
      // 取消主项：取消主项本身 + 其所有子项
      unstageItem(gid)
      const subs = groups[gIndex]?.categories || []
      subs.forEach((_, sIndex) => unstageItem(`sub-${gIndex}-${sIndex}`))
    } else {
      // 选中主项：主项 + 全部子项加入暂存
      stageItem(gid, groups[gIndex]?.name || '')
      const subs = groups[gIndex]?.categories || []
      subs.forEach((sub: any, sIndex: number) => stageItem(`sub-${gIndex}-${sIndex}`, sub?.name || ''))
      setDeleteMode('multi')
    }
  }

  const handleToggleSubSelect = (gIndex: number, sIndex: number) => {
    const sid = `sub-${gIndex}-${sIndex}`
    if (isStaged(sid)) {
      unstageItem(sid)
    } else {
      const sub = groups[gIndex]?.categories?.[sIndex] as any
      stageItem(sid, sub?.name || '')
      setDeleteMode('multi')
    }
  }

  // 添加子项并进入编辑
  const handleAddSub = (gIndex: number) => {
    setGroups((items) => {
      const next = [...items]
      const newItem = { name: '', count: 0 }
      next[gIndex] = { ...next[gIndex], categories: [newItem, ...next[gIndex].categories] }
      return next
    })
    setEditingSubId(`sub-${gIndex}-0`)
    setEditingSubText('')
  }

  const handleEditingChange = (value: string) => setEditingSubText(value)

  const handleCommitEdit = (gIndex: number, sIndex: number, cancel?: boolean) => {
    const sid = `sub-${gIndex}-${sIndex}`
    setGroups((items) => {
      const next = [...items]
      const cats = [...next[gIndex].categories]
      if (cancel) {
        // 取消：若是新建且为空，则移除；否则不改名
        const isNewAndEmpty = (cats[sIndex] as any)?.name === ''
        if (isNewAndEmpty) {
          cats.splice(sIndex, 1)
        }
      } else {
        const name = editingSubText.trim()
        if (name.length === 0) {
          // 空名也移除
          cats.splice(sIndex, 1)
        } else {
          cats[sIndex] = { ...(cats[sIndex] as any), name }
        }
      }
      next[gIndex] = { ...next[gIndex], categories: cats }
      return next
    })
    setEditingSubId(null)
    setEditingSubText('')
  }

  // 悬浮回收站按钮：在多选情况下直接确认删除；否则不展开
  const handleTrashButtonClick = () => {
    // 触发释放动画
    setTrashBurst(true)
    // 触发图标反色：描边变红、内部变白
    setTrashInvert(true)
    setTimeout(() => setTrashInvert(false), 1000)
    setTimeout(() => setTrashBurst(false), 900)

    if (deleteMode === 'multi' && stagedIds.length > 0) {
      // 打开确认框（多选）
      const items = stagedIds.map((id) => ({ id, label: stagedLabels[id] || id }))
      setConfirmItems(items)
      setConfirmMode('multi')
      // 打开确认框前，确保其他弹层关闭
      setNewGroupOpen(false)
      setHasChildrenDialogOpen(false)
      setConfirmOpen(true)
      return
    }
    // 无选择时，弹出告示牌动画提示
    if (!showNoSelectionTip) {
      setShowNoSelectionTip(true)
      setTimeout(() => setShowNoSelectionTip(false), 1800)
    }
    return
  }

  const startLongPress = (_targetKey: string) => {
    clearLongPress()
    longPressTimerRef.current = setTimeout(() => {
      console.log('进入编辑模式')
      setIsEdit(true)
    }, longPressDelayMs)
  }

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const exitEdit = () => {
    // 退出编辑时，强制关闭回收站面板与相关浮层
    setTrashOpen(false)
    setKeepTrashVisible(false)
    setConfirmOpen(false)
    // 清空所有勾选的暂存项
    setStagedIds([])
    setStagedLabels({})
    setDeleteMode('single')
    setIsEdit(false)
  }

  const requestExitEdit = () => {
    if (!isEdit) return
    // 先触发动画帧，让行内控件和布局收起
    setIsEditAnimating(true)
    // 在动画完成后再真正退出编辑模式
    window.setTimeout(() => {
      exitEdit()
      setIsEditAnimating(false)
    }, 300)
  }
  
  const handleToggle = () => {
    if (!isCollapsed) {
      // 如果当前是展开状态，点击收起
      // 如果在编辑模式下，先退出编辑模式
      if (isEdit) requestExitEdit()
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

  // 自定义碰撞检测：统一用 rectIntersection，并优先命中回收区
  const customCollisionDetection = (args: any) => {
    const results = rectIntersection(args)
    const trashHit = results.find((r: any) => r?.id?.toString?.() === 'trash-dropzone')
    if (trashHit) return [trashHit]
    // 子项拖拽时：忽略当前组的容器（避免顶端“添加子项”区域成为落点）
    const activeIdStr = args?.active?.id?.toString?.() || ''
    if (activeIdStr.startsWith('sub-')) {
      const [, activeGIndex] = activeIdStr.split('-')
      const remapped = results.map((r: any) => {
        const idStr = r?.id?.toString?.() || ''
        // 其它组的任意元素（group- / sub-container- / sub-）全部映射为其 group-*
        if (idStr.startsWith('group-')) {
          const [, gIndexStr] = idStr.split('-')
          if (gIndexStr !== activeGIndex) return { ...r, id: `group-${gIndexStr}` }
          return r
        }
        if (idStr.startsWith('sub-container-')) {
          const [, , gIndexStr] = idStr.split('-')
          if (gIndexStr !== activeGIndex) return { ...r, id: `group-${gIndexStr}` }
          // 同组容器过滤掉，避免“添加子项”成为顶部落点
          return { ...r, id: `ignore-${idStr}` }
        }
        if (idStr.startsWith('sub-')) {
          const [, gIndexStr] = idStr.split('-')
          if (gIndexStr !== activeGIndex) return { ...r, id: `group-${gIndexStr}` }
          // 同组子项保持原样，继续支持组内排序
          return r
        }
        return r
      })
      // 过滤 ignore-*，仅保留有效命中，并对 group-* 去重，保持原顺序
      const seen = new Set<string>()
      const deduped: any[] = []
      for (const r of remapped) {
        const idStr = r?.id?.toString?.() || ''
        if (idStr.startsWith('ignore-')) continue
        if (idStr.startsWith('group-')) {
          if (!seen.has(idStr)) { seen.add(idStr); deduped.push(r) }
          continue
        }
        deduped.push(r)
      }
      return deduped
    }
    // 主项拖拽时：将展开的 sub-container-{g} 与 sub-{g}-{s} 统统视为其 group-{g}
    if (activeIdStr.startsWith('group-')) {
      const remapped = results.map((r: any) => {
        const idStr = r?.id?.toString?.() || ''
        if (idStr.startsWith('sub-container-')) {
          const [, , gIndexStr] = idStr.split('-')
          return { ...r, id: `group-${gIndexStr}` }
        }
        if (idStr.startsWith('sub-')) {
          const [, gIndexStr] = idStr.split('-')
          return { ...r, id: `group-${gIndexStr}` }
        }
        return r
      })
      // 仅保留 group-* 命中，并去重，保持原有排序优先级
      const seen = new Set<string>()
      const deduped: any[] = []
      for (const r of remapped) {
        const idStr = r?.id?.toString?.() || ''
        if (!idStr.startsWith('group-')) continue
        if (!seen.has(idStr)) { seen.add(idStr); deduped.push(r) }
      }
      return deduped.length ? deduped : remapped
    }
    return results
  }

  // 生成稳定的主项 items 数组，确保排序动画计算正确
  const groupItems = useMemo(
    () => groups.map((_, gIndex) => `group-${gIndex}`),
    [groups]
  )

  // 简化的拖拽位置计算
  const _getInsertPosition = (activeId: string, overId: string) => {
    if (!activeId.startsWith('sub-') || !overId.startsWith('sub-')) {
      return null
    }

    const [, activeGIndex, activeSIndex] = activeId.split('-')
    const [, overGIndex, overSIndex] = overId.split('-')
    
    const fromG = parseInt(activeGIndex)
    const fromS = parseInt(activeSIndex)
    const toG = parseInt(overGIndex)
    const toS = parseInt(overSIndex)
    
    console.log('Position calculation:', { fromG, fromS, toG, toS })
    
    return { fromG, fromS, toG, toS }
  }

  // DnD Kit setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // 无全局延迟：子项可即时拖拽；主项通过头部长按后才绑定监听
        distance: 2,
        tolerance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    if (isDragging) return // 防止重复拖拽
    
    const activeId = event.active.id.toString()
    setActiveId(activeId)
    setIsDragging(true)
    // 拖动单个项时默认展示“单独删除”界面
    setDeleteMode('single')
    // 立即展开回收面板，确保删除区可被命中
    setTrashOpen(true)
    
    // 找到拖拽的项目
    if (activeId.startsWith('sub-')) {
      const [, gIndex, sIndex] = activeId.split('-')
      const group = groups[parseInt(gIndex)]
      const item = group.categories[parseInt(sIndex)]
      setActiveItem(item)
    } else if (activeId.startsWith('group-')) {
      const [, gIndex] = activeId.split('-')
      const group = groups[parseInt(gIndex)]
      setActiveItem(group)
    }
    
    console.log('Drag start:', activeId)
  }

  const handleDragOver = (event: any) => {
    const { over } = event
    const newOverId = over?.id?.toString() || null
    
    // 只在真正改变时才更新，避免频繁的状态更新导致动画不稳定
    if (newOverId !== overId) {
      setOverId(newOverId)
    }
  }

  const handleDragCancel = () => {
    console.log('Drag cancelled')
    setActiveId(null)
    setOverId(null)
    setActiveItem(null)
    setIsDragging(false)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isDragging) return // 防止重复处理
    
    const { active, over } = event
    
    console.log('=== Drag End Debug ===')
    console.log('Active:', active.id.toString())
    console.log('Over:', over?.id?.toString() || 'null')
    console.log('Active type:', active.id.toString().startsWith('group-') ? 'group' : 'sub')
    console.log('Over type:', over?.id?.toString().startsWith('group-') ? 'group' : over?.id?.toString().startsWith('sub-') ? 'sub' : over?.id?.toString().startsWith('sub-container-') ? 'container' : 'unknown')

    if (!over) {
      // Fallback：手动检测拖拽项矩形是否进入回收区
      const trashEl = document.getElementById('trash-dropzone') as HTMLElement | null
      const activeRect = active.rect?.current?.translated || active.rect?.current?.initial
      if (trashEl && activeRect) {
        const t = trashEl.getBoundingClientRect()
        const a = activeRect
        const ax = a.left + (a.width ?? 0) / 2
        const ay = a.top + (a.height ?? 0) / 2
        const inside = ax >= t.left && ax <= t.right && ay >= t.top && ay <= t.bottom
        if (inside) {
          // 视为拖入回收区
          // 继续按回收区逻辑处理
          
          // 防止重复
          console.log('Fallback hit trash-dropzone')
          // 直接递归使用已有分支
          // 手动执行与回收区相同流程
          // 展开面板并弹确认（仅单独删除流程保持 dropbox）
          if (deleteMode === 'single') {
            setTrashOpen(true)
            setKeepTrashVisible(true)
          }
          if (active.id.toString().startsWith('group-')) {
            const gi = parseInt(active.id.toString().replace('group-',''))
            const group = groups[gi]
            if (group && group.categories.length === 0) {
              setConfirmItems([{ id: active.id.toString(), label: group.name }])
              setConfirmMode('single')
              setNewGroupOpen(false)
              setHasChildrenDialogOpen(false)
              setConfirmOpen(true)
            } else {
              setHasChildrenGroupName(group.name)
              setHasChildrenDialogOpen(true)
            }
          } else if (active.id.toString().startsWith('sub-')) {
            const [, gStr, sStr] = active.id.toString().split('-')
            const gi = parseInt(gStr); const si = parseInt(sStr)
            const sub: any = groups[gi]?.categories?.[si]
            setConfirmItems([{ id: active.id.toString(), label: sub?.name || '' }])
            setConfirmMode('single')
            setNewGroupOpen(false)
            setHasChildrenDialogOpen(false)
            setConfirmOpen(true)
          }
          // 清理拖拽状态
          setActiveId(null); setOverId(null); setActiveItem(null); setIsDragging(false)
          return
        }
      }
      console.log('No drop target, drag cancelled')
      setActiveId(null)
      setOverId(null)
      setActiveItem(null)
      setIsDragging(false)
      return
    }

    const activeId = active.id.toString()
    const overId = over.id.toString()

    // 删除投递区处理
    if (overId === 'trash-dropzone') {
      if (deleteMode === 'single') {
        // 拖拽删除：保持 dropbox 展开直到确认/取消
        setTrashOpen(true)
        setKeepTrashVisible(true)
        if (activeId.startsWith('group-')) {
          const gIndex = parseInt(activeId.replace('group-', ''))
          const group = groups[gIndex]
          if (group.categories.length > 0) {
            setHasChildrenGroupName(group.name)
            setHasChildrenDialogOpen(true)
          } else {
            setConfirmItems([{ id: activeId, label: group.name }])
            setConfirmMode('single')
            setNewGroupOpen(false)
            setHasChildrenDialogOpen(false)
            setConfirmOpen(true)
          }
        } else if (activeId.startsWith('sub-')) {
          const [, gIndexStr, sIndexStr] = activeId.split('-')
          const gIndex = parseInt(gIndexStr)
          const sIndex = parseInt(sIndexStr)
          const sub = groups[gIndex]?.categories?.[sIndex] as any
          setConfirmItems([{ id: activeId, label: sub?.name || '' }])
          setConfirmMode('single')
          setNewGroupOpen(false)
          setHasChildrenDialogOpen(false)
          setConfirmOpen(true)
        }
      } else {
        // multi 模式：暂存
        if (activeId.startsWith('group-')) {
          const gIndex = parseInt(activeId.replace('group-', ''))
          const group = groups[gIndex]
          stageItem(activeId, group.name)
        } else if (activeId.startsWith('sub-')) {
          const [, gIndexStr, sIndexStr] = activeId.split('-')
          const gIndex = parseInt(gIndexStr)
          const sIndex = parseInt(sIndexStr)
          const sub = groups[gIndex]?.categories?.[sIndex] as any
          stageItem(activeId, sub?.name || '')
        }
      }
      // 清理拖拽状态（保持 dropbox 可见）
      setActiveId(null)
      setOverId(null)
      setActiveItem(null)
      setIsDragging(false)
      return
    }

    // 处理主分类重排序
    if (activeId.startsWith('group-') && overId.startsWith('group-')) {
      const activeIndex = parseInt(activeId.replace('group-', ''))
      const overIndex = parseInt(overId.replace('group-', ''))
      
      console.log('Group reorder:', { activeIndex, overIndex })
      
      if (activeIndex !== overIndex) {
        setGroups((items) => {
          const newItems = arrayMove(items, activeIndex, overIndex)
          console.log('Groups after reorder:', newItems.map(g => g.name))
          return newItems
        })
      }
    }
    
    // 处理子项重排序 - 使用 @dnd-kit 的内置逻辑
    else if (activeId.startsWith('sub-') && overId.startsWith('sub-')) {
      const [, activeGIndex, activeSIndex] = activeId.split('-')
      const [, overGIndex, overSIndex] = overId.split('-')
      
      const fromG = parseInt(activeGIndex)
      const fromS = parseInt(activeSIndex)
      const toG = parseInt(overGIndex)
      const toS = parseInt(overSIndex)
      
      console.log('Sub reorder:', { fromG, fromS, toG, toS })
      
      if (fromG === toG) {
        // 同组内重排序
        if (fromS !== toS) {
          setGroups((items) => {
            const newItems = [...items]
            // 测试 arrayMove 的行为
            console.log('Before arrayMove:', newItems[fromG].categories.map(c => c.name))
            console.log('arrayMove params:', { fromS, toS })
            
            // 根据测试结果，Method 1（直接使用 toS）在所有情况下都是正确的
            // arrayMove 的第三个参数就是目标索引，不需要任何调整
            newItems[fromG].categories = arrayMove(newItems[fromG].categories, fromS, toS)
            
            console.log('After arrayMove:', newItems[fromG].categories.map(c => c.name))
            console.log('Same group reorder:', { fromS, toS })
            console.log('Same group reorder result:', newItems[fromG].categories.map(c => c.name))
            return newItems
          })
        }
      } else {
        // 跨组移动
        setGroups((items) => {
          const newItems = [...items]
          const [movedItem] = newItems[fromG].categories.splice(fromS, 1)
          
          // 计算正确的插入位置
          let insertIndex = toS
          if (fromG < toG) {
            // 从低索引组拖拽到高索引组时，不需要调整
            insertIndex = toS
          } else {
            // 从高索引组拖拽到低索引组时，需要调整
            insertIndex = toS
          }
          
          newItems[toG].categories.splice(insertIndex, 0, movedItem)
          console.log('Cross group move:', { fromG, fromS, toG, toS, insertIndex })
          console.log('Cross group move result:', {
            from: newItems[fromG].categories.map(c => c.name),
            to: newItems[toG].categories.map(c => c.name)
          })
          return newItems
        })
      }
    }
    
    // 处理拖拽到容器
    else if (activeId.startsWith('sub-') && overId.startsWith('sub-container-')) {
      const [, activeGIndex, activeSIndex] = activeId.split('-')
      const [, , overGIndex] = overId.split('-')
      
      const fromG = parseInt(activeGIndex)
      const fromS = parseInt(activeSIndex)
      const toG = parseInt(overGIndex)
      
      console.log('Move to container:', { fromG, fromS, toG })
      
      if (fromG !== toG) {
        setGroups((items) => {
          const newItems = [...items]
          const [movedItem] = newItems[fromG].categories.splice(fromS, 1)
          newItems[toG].categories.push(movedItem)
          console.log('Moved to container result:', newItems[toG].categories.map(c => c.name))
          return newItems
        })
      }
    }
    // 处理子项拖拽到主项（整组高光命中后，将子项加入该主项）
    else if (activeId.startsWith('sub-') && overId.startsWith('group-')) {
      const [, activeGIndex, activeSIndex] = activeId.split('-')
      const toGIndex = parseInt(overId.replace('group-',''))
      const fromG = parseInt(activeGIndex)
      const fromS = parseInt(activeSIndex)
      console.log('Move sub to group:', { fromG, fromS, toGIndex })
      setGroups((items) => {
        const newItems = [...items]
        const [movedItem] = newItems[fromG].categories.splice(fromS, 1)
        // 插入到目标组末尾（也可以改为特定位置策略）
        newItems[toGIndex].categories.push(movedItem)
        console.log('After move to group:', {
          to: newItems[toGIndex].categories.map(c => c.name),
          from: newItems[fromG].categories.map(c => c.name),
        })
        return newItems
      })
    }
    
    console.log('=== Drag End Complete ===')
    
    // 清理拖拽状态
    setActiveId(null)
    setOverId(null)
    setActiveItem(null)
    setIsDragging(false)
  }

  return (
    <div className={`bg-background border-r border-border transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-64'} min-h-screen`}>
      <div className="px-0 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className={`mb-2 ${isCollapsed ? 'w-full justify-center p-0 h-12' : 'w-full justify-start'} hover:bg-muted bg-transparent`}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4 mr-2" />
          )}
          {showText && <span style={{opacity: textOpacity, transition: 'opacity 0.2s ease-in-out'}}>收起</span>}
        </Button>
        

        {/* 内容层容器：使收起与展开层重叠，并统一布局动画 */}
        <LayoutGroup>
        <div className="relative">
        {/* 收起模式：只显示图标（置于上层，便于先行位移动画） */}
        <AnimatePresence>
          {!showText && (
            <motion.div 
              key="collapsed-mode"
              className="absolute inset-0 z-10 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "tween", duration: 0.3, delay: 0.2 } as any}
            >
              {groups.map((group, gIndex) => (
                <motion.div
                  key={`collapsed-${group.name}`}
                  layoutId={`group-icon-${gIndex}`}
                  className="flex items-center justify-center p-3 rounded hover:bg-muted/30 cursor-pointer w-12 h-12"
                  onClick={() => toggleGroup(group.name)}
                  onMouseDown={() => { if (!isEdit && startLongPress) startLongPress(`group-${gIndex}`) }}
                  onMouseUp={() => { if (!isEdit && clearLongPress) clearLongPress() }}
                  onMouseLeave={() => { if (!isEdit && clearLongPress) clearLongPress() }}
                  onTouchStart={() => { if (!isEdit && startLongPress) startLongPress(`group-${gIndex}`) }}
                  onTouchEnd={() => { if (!isEdit && clearLongPress) clearLongPress() }}
                  transition={{ type: "tween", duration: 0.5 as any, ease: [0.38, 0.07, 0.49, 0.94] as any }}
                >
                  <group.icon className="h-5 w-5 text-foreground" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 展开模式：显示完整内容（底层） */}
        <AnimatePresence>
          {showText && (
            <motion.div 
              key="expanded-mode"
              className="space-y-4"
              style={{opacity: textOpacity, transition: 'opacity 0.2s ease-in-out'}}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "tween", duration: 0.3, delay: 0.1 } as any}
            >
            {/* 顶部：编辑模式下显示"新建主项"占位按钮 */}
            <AnimatePresence>
              {isEdit && (
                <motion.button
                  key="add-group"
                  type="button"
                  onClick={openNewGroupDialog}
                  className="w-full border-2 border-dashed border-border rounded-md py-4 px-3 flex items-center justify-center hover:bg-muted/40 transition-colors"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
            transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">新建主项</span>
                  </div>
                </motion.button>
              )}
            </AnimatePresence>

            <DndContext
              sensors={sensors}
              collisionDetection={customCollisionDetection}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
              measuring={{
                droppable: {
                  strategy: MeasuringStrategy.WhileDragging,
                },
              }}
            >
              <SortableContext
                items={groupItems}
                strategy={verticalListSortingStrategy}
                key={`group-context-${groupItems.length}`}
              >
                <div className="space-y-2">
                  {groups.map((group, gIndex) => (
                    <SortableGroup
                      key={`group-${gIndex}`}
                      group={group}
                      gIndex={gIndex}
                      isEdit={isEdit}
                      isEditAnimating={isEditAnimating}
                      openGroups={openGroups}
                      toggleGroup={toggleGroup}
                      startLongPress={startLongPress}
                      clearLongPress={clearLongPress}
                      activeId={activeId}
                      overId={overId}
                      isStaged={isStaged}
                      onToggleGroupSelect={handleToggleGroupSelect}
                      onToggleSubSelect={handleToggleSubSelect}
                      onAddSub={handleAddSub}
                      editingSubId={editingSubId}
                      editingSubText={editingSubText}
                      onEditingChange={handleEditingChange}
                      onCommitEdit={handleCommitEdit}
                    />
                  ))}
                </div>
              </SortableContext>
              
              {/* 拖拽覆盖层 - 禁用动画 */}
              <DragOverlay dropAnimation={null}>
                {activeItem ? (
                  <div className="flex items-center justify-between p-2 rounded bg-background border border-border shadow-lg -translate-y-1/2">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-foreground">{activeItem.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {activeItem.count}
                    </Badge>
                  </div>
                ) : null}
              </DragOverlay>

              {/* 删除投递区覆盖层（拖拽中或手动展开时显示；带放大/缩小动画） */}
              <AnimatePresence>
                {(isDragging || keepTrashVisible) && (
                  <motion.div
                    className="fixed inset-0 z-40 pointer-events-none"
                    onClick={() => setTrashOpen(false)}
                    transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
                  >
                    <motion.div
                      ref={setTrashRef as any}
                      id="trash-dropzone"
                      className={`pointer-events-auto fixed right-[3rem] bottom-[7.5rem] w-[50vw] h-[50vh] rounded-lg border-2 border-destructive ${isOverTrash ? 'bg-destructive/10' : 'bg-background/40'} ring-1 ring-destructive/40 shadow-lg flex flex-col overflow-hidden`}
                      variants={trashVariants}
                      initial="closed"
                      animate={(isDragging || keepTrashVisible) ? 'open' : 'closed'}
                      exit="closed"
                      custom={Math.max(window.innerWidth, window.innerHeight)}
                      style={{ transformOrigin: 'bottom right', willChange: 'clip-path', backdropFilter: 'blur(8px)' }}
                      onClick={(e) => e.stopPropagation()}
                      transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
                    >
                    {/* 中部：提示 */}
                    <div className="h-full w-full grid place-items-center text-destructive">
                      <div className="flex items-center gap-3">
                        <Trash2 className="h-7 w-7" />
                        <span className="text-xl font-semibold">拖到此处删除（会弹出确认）</span>
                      </div>
                    </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Dialog open={confirmOpen} onOpenChange={(v) => { setConfirmOpen(!!v); if (!v) { setTrashOpen(false); setKeepTrashVisible(false) } }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>确认删除</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[50vh] overflow-auto">
                    {confirmItems.map((it) => (
                      <div key={it.id} className="px-2 py-2 text-sm border-b last:border-b-0 border-border/60 flex items-center gap-2">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="truncate">{it.label}</span>
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => { setConfirmOpen(false); setTrashOpen(false); setKeepTrashVisible(false) }}>取消</Button>
                    <Button variant="destructive" size="sm" onClick={() => {
                      if (confirmMode === 'single') {
                        const [item] = confirmItems
                        if (!item) return
                        setGroups((items) => {
                          let next = [...items]
                          if (item.id.startsWith('group-')) {
                            const gi = parseInt(item.id.replace('group-',''))
                            if (next[gi] && next[gi].categories.length === 0) {
                              next = next.filter((_, idx) => idx !== gi)
                            }
                          } else if (item.id.startsWith('sub-')) {
                            const [, gStr, sStr] = item.id.split('-')
                            const gi = parseInt(gStr)
                            const si = parseInt(sStr)
                            if (next[gi]) {
                              next[gi] = { ...next[gi], categories: next[gi].categories.filter((_, idx) => idx !== si) }
                            }
                          }
                          return next
                        })
                      } else {
                        setGroups((items) => {
                          let next = [...items]
                          for (const it of confirmItems) {
                            if (it.id.startsWith('group-')) {
                              const gi = parseInt(it.id.replace('group-',''))
                              if (next[gi] && next[gi].categories.length === 0) {
                                next = next.filter((_, idx) => idx !== gi)
                              }
                            } else if (it.id.startsWith('sub-')) {
                              const [, gStr, sStr] = it.id.split('-')
                              const gi = parseInt(gStr)
                              const si = parseInt(sStr)
                              if (next[gi]) {
                                next[gi] = { ...next[gi], categories: next[gi].categories.filter((_, idx) => idx !== si) }
                              }
                            }
                          }
                          return next
                        })
                        setStagedIds([]); setStagedLabels({}); setDeleteMode('single')
                      }
                      setConfirmOpen(false); setTrashOpen(false); setKeepTrashVisible(false)
                    }}>确认删除</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={hasChildrenDialogOpen} onOpenChange={(v) => setHasChildrenDialogOpen(!!v)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>无法删除主项</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 text-sm">
                    <div>主项「{hasChildrenGroupName}」仍包含子项。</div>
                    <div>请先删除该主项内的所有子项后再删除主项。</div>
                  </div>
                  <DialogFooter>
                    <Button size="sm" onClick={() => { setHasChildrenDialogOpen(false); setTrashOpen(false); setKeepTrashVisible(false) }}>我知道了</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={newGroupOpen} onOpenChange={(v) => setNewGroupOpen(!!v)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新建主项</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">主项名称</label>
                      <input
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="请输入主项名称"
                        className="w-full h-9 px-3 rounded-md border bg-background outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-2">选择图标（带预览）</label>
                      <div className="grid grid-cols-8 gap-2">
                        {availableIcons.map(({ key, Comp }) => {
                          const selected = newGroupIcon === Comp
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setNewGroupIcon(Comp)}
                              className={`aspect-square rounded-md border flex items-center justify-center hover:bg-muted/60 ${selected ? 'ring-2 ring-primary border-primary' : ''}`}
                            >
                              <Comp className="h-5 w-5" />
                            </button>
                          )
                        })}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>已选图标预览：</span>
                        {(() => {
                          const Preview = newGroupIcon
                          return <Preview className="h-5 w-5" />
                        })()}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => setNewGroupOpen(false)}>取消</Button>
                    <Button size="sm" onClick={confirmCreateGroup}>创建</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* 未选择提示黑色告示框（从删除按钮处弹出） */}
              <AnimatePresence>
                {showNoSelectionTip && (
                  <motion.div
                    className="fixed right-6 bottom-24 z-50 -translate-y-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ pointerEvents: 'none' }}
                    transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
                  >
                    <motion.div
                      className="relative px-4 py-2 rounded-md bg-black text-white shadow-xl"
                      initial={{ y: 20, scale: 0.6, opacity: 0 }}
                      animate={{ y: 0, scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 10 } }}
                      exit={{ y: 20, scale: 0.6, opacity: 0 }}
                      transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
                    >
                      <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                      <div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
                      <div className="relative z-30 text-sm font-semibold">您还未选择任何需要删除的标签</div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 右下角垃圾桶按钮（带释放动画） */}
              <AnimatePresence>
                {isEdit && (
                  <motion.div 
                    key="trash-button"
                    className="fixed right-6 bottom-24 z-40"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
              transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
                  >
                    <IconButton
                      icon={Trash2}
                      active={trashBurst}
                      color={[239, 68, 68]}
                      size="lg"
                      className="!size-12 leading-none grid place-items-center bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90"
                      popIcon={true}
                      hoverScale={1}
                      tapScale={1}
                      invertIcon={trashInvert}
                      aria-label="Toggle trash panel"
                      onClick={handleTrashButtonClick}
                      transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </DndContext>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
        </LayoutGroup>

        {isEdit && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={requestExitEdit}
              className="w-full"
            >
              退出编辑
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}