import React, { useState, useEffect, useRef, useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
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
  Trash2
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  closestCorners,
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
const trashVariants = {
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
const IconPath = (props: any) => (
  <motion.path fill="transparent" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" {...props} />
)

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
const SortableSubItem = ({ category, gIndex, sIndex, isEdit, activeId, overId, isStaged, onToggleSelect }: any) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-2 rounded hover:bg-muted transition-colors ${isEdit ? 'cursor-grab' : 'cursor-pointer'} ${isSubDragging ? 'opacity-30' : ''} ${isActive ? 'ring-2 ring-primary' : ''} ${isOver ? 'bg-primary/10 border-2 border-primary/50' : ''} ${isSelected ? 'opacity-60' : ''}`}
      {...(isEdit && !isSelected ? attributes : {})}
      {...(isEdit && !isSelected ? listeners : {})}
    >
      <div className="flex items-center space-x-2 overflow-hidden">
        {isEdit && (
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-destructive"
            checked={isSelected}
            onChange={(e) => { e.stopPropagation(); onToggleSelect && onToggleSelect(gIndex, sIndex) }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {isEdit && (
          <div className="cursor-grab p-1 hover:bg-muted rounded">
            <GripVertical className="h-3 w-3 text-muted-foreground flex-none" />
          </div>
        )}
        <span className="text-sm text-foreground whitespace-nowrap truncate min-w-0">
          {category.name}
        </span>
      </div>
      <Badge variant="secondary" className="text-xs flex-none">
        {category.count}
      </Badge>
    </div>
  )
}

// Sortable Sub Items Component
const SortableSubItems = ({ group, gIndex, isEdit, activeId, overId, isStaged, onToggleSubSelect }: any) => {
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

  // 简化的插入位置指示器
  const getInsertIndicator = () => {
    if (!activeId || !overId || !activeId.startsWith('sub-')) return null
    
    const [, , overGIndex] = overId.split('-')
    const toG = parseInt(overGIndex)
    
    // 如果拖拽到这个组，显示指示器
    if (toG === gIndex) {
      return (
        <div className="h-1 bg-primary/50 rounded-full mx-2 my-1 animate-pulse" />
      )
    }
    
    return null
  }

  return (
    <div
      ref={setNodeRef}
      className={`ml-6 space-y-3 mt-2 overflow-hidden transition-colors duration-200 ${isOver ? 'bg-primary/10 border border-primary/30 rounded-md' : ''}`}
    >
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
            activeId={activeId}
            overId={overId}
            isStaged={isStaged}
            onToggleSelect={onToggleSubSelect}
          />
        ))}
        {/* 插入位置指示器 - 放在最后 */}
        {getInsertIndicator()}
      </SortableContext>
    </div>
  )
}


// Sortable Group Component
const SortableGroup = ({ group, gIndex, isEdit, openGroups, toggleGroup, startLongPress, clearLongPress, activeId, overId, isStaged, onToggleGroupSelect, onToggleSubSelect }: any) => {
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
        className={`flex items-center justify-between w-full`}
        onClick={() => { if (!isEdit) toggleGroup(group.name) }}
      >
        {/* 左侧：拖拽手柄区域（编辑模式可拖拽） */}
        <div
          className={`flex items-center space-x-2 overflow-hidden ${isEdit ? 'cursor-grab hover:bg-muted/50' : 'hover:bg-muted/30'}`}
          {...(isEdit && !groupSelected ? attributes : {})}
          {...(isEdit && !groupSelected ? listeners : {})}
        >
          {isEdit && (
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-destructive"
              checked={groupSelected}
              onChange={(e) => { e.stopPropagation(); onToggleGroupSelect && onToggleGroupSelect(gIndex, groupSelected) }}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {isEdit && (
            <div className="cursor-grab p-1 hover:bg-muted rounded">
              <GripVertical className="h-3 w-3 text-muted-foreground flex-none" />
            </div>
          )}
          <group.icon className="h-4 w-4 text-foreground" />
          <span
            className={`font-medium text-foreground whitespace-nowrap transform-gpu transition-all duration-300 ${
              true ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0'
            }`}
          >
            {group.name}
          </span>
        </div>
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
            transition={{ duration: 0.22, ease: [0.22, 0.0, 0.2, 1] }}
            onMouseDown={(e) => {
              // 防止在展开区域误启动主项拖拽
              if (isEdit) e.stopPropagation()
            }}
          >
            <SortableSubItems group={group} gIndex={gIndex} isEdit={isEdit} activeId={activeId} overId={overId} isStaged={isStaged} onToggleSubSelect={onToggleSubSelect} />
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
  const [trashOpen, setTrashOpen] = useState(false)
  const [keepTrashVisible, setKeepTrashVisible] = useState(false)
  // 删除确认框
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMode, setConfirmMode] = useState<'single' | 'multi'>('single')
  const [confirmItems, setConfirmItems] = useState<{ id: string, label: string }[]>([])
  // 退出编辑时自动收起
  useEffect(() => {
    if (!isEdit) setTrashOpen(false)
  }, [isEdit])

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

  // 悬浮回收站按钮：在多选情况下直接确认删除；否则不展开
  const handleTrashButtonClick = () => {
    if (deleteMode === 'multi' && stagedIds.length > 0) {
      // 打开确认框（多选）
      const items = stagedIds.map((id) => ({ id, label: stagedLabels[id] || id }))
      setConfirmItems(items)
      setConfirmMode('multi')
      setConfirmOpen(true)
      return
    }
    // 非多选时，点击按钮不展开任何面板
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

  const exitEdit = () => { setIsEdit(false) }
  
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

  // 自定义碰撞检测：统一用 rectIntersection，并优先命中回收区
  const customCollisionDetection = (args: any) => {
    const results = rectIntersection(args)
    const trashHit = results.find((r: any) => r?.id?.toString?.() === 'trash-dropzone')
    if (trashHit) return [trashHit]
    return results
  }

  // 生成稳定的主项 items 数组，确保排序动画计算正确
  const groupItems = useMemo(
    () => groups.map((_, gIndex) => `group-${gIndex}`),
    [groups]
  )

  // 简化的拖拽位置计算
  const getInsertPosition = (activeId: string, overId: string) => {
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
          const fakeOver = { id: 'trash-dropzone' }
          // 继续按回收区逻辑处理
          const fakeEvent: any = { active, over: fakeOver }
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
              setConfirmOpen(true)
            } else {
              alert('请先删除该主项内的所有子项后再删除主项')
            }
          } else if (active.id.toString().startsWith('sub-')) {
            const [, gStr, sStr] = active.id.toString().split('-')
            const gi = parseInt(gStr); const si = parseInt(sStr)
            const sub: any = groups[gi]?.categories?.[si]
            setConfirmItems([{ id: active.id.toString(), label: sub?.name || '' }])
            setConfirmMode('single')
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
            alert('请先删除该主项内的所有子项后再删除主项')
          } else {
            setConfirmItems([{ id: activeId, label: group.name }])
            setConfirmMode('single')
            setConfirmOpen(true)
          }
        } else if (activeId.startsWith('sub-')) {
          const [, gIndexStr, sIndexStr] = activeId.split('-')
          const gIndex = parseInt(gIndexStr)
          const sIndex = parseInt(sIndexStr)
          const sub = groups[gIndex]?.categories?.[sIndex] as any
          setConfirmItems([{ id: activeId, label: sub?.name || '' }])
          setConfirmMode('single')
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
        
        {/* 临时编辑模式切换按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEdit(!isEdit)}
          className={`mb-2 w-full text-xs ${isEdit ? 'bg-primary text-primary-foreground' : ''}`}
        >
          {isEdit ? '退出编辑' : '编辑模式'}
        </Button>
        
        {/* 调试信息 */}
        {isEdit && (
          <div className="mb-2 p-2 bg-muted rounded text-xs">
            <div>Active: {activeId || 'none'}</div>
            <div>Over: {overId || 'none'}</div>
            <div>Groups: {groups.length}</div>
          </div>
        )}

        {showText && (
          <div className="space-y-4" style={{opacity: textOpacity, transition: 'opacity 0.2s ease-in-out'}}>
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
                      openGroups={openGroups}
                      toggleGroup={toggleGroup}
                      startLongPress={startLongPress}
                      clearLongPress={clearLongPress}
                      activeId={activeId}
                      overId={overId}
                      isStaged={isStaged}
                      onToggleGroupSelect={handleToggleGroupSelect}
                      onToggleSubSelect={handleToggleSubSelect}
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

              {/* 全屏确认对话框（shadcn/dialog 风格替代） */}
              {confirmOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center" onClick={() => { setConfirmOpen(false); setTrashOpen(false) }}>
                  <div className="w-[520px] max-w-[92vw] rounded-lg border bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <div className="px-4 py-3 border-b text-base font-semibold">确认删除</div>
                    <div className="px-4 py-3 max-h-[50vh] overflow-auto">
                      {confirmItems.map((it) => (
                        <div key={it.id} className="px-2 py-2 text-sm border-b last:border-b-0 border-border/60 flex items-center gap-2">
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="truncate">{it.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
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
                    </div>
                  </div>
                </div>
              )}

              {/* 右下角圆形开关按钮（MenuToggle 动画） */}
              {isEdit && (
                <motion.button
                  type="button"
                  className="fixed right-6 bottom-24 h-12 w-12 rounded-full bg-destructive text-destructive-foreground shadow flex items-center justify-center z-40 hover:bg-destructive/90"
                  onClick={handleTrashButtonClick}
                  initial={{ scale: 0.9, opacity: 0.9 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.24, ease: [0.62, 0.24, 0.46, 0.86] }}
                  aria-label="Toggle trash panel"
                >
                  <Trash2 className="h-6 w-6" />
                </motion.button>
              )}
            </DndContext>
          </div>
        )}

        {isEdit && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={exitEdit}
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