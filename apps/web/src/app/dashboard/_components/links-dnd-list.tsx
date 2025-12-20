'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

import { cn } from '@acme/ui';

export type DndLink = { id: string };

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (opts: {
    isDragging: boolean;
    handleProps: {
      setActivatorNodeRef: (element: HTMLElement | null) => void;
      attributes: any;
      listeners: any;
    };
  }) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-80')}>
      {children({
        isDragging,
        handleProps: {
          setActivatorNodeRef,
          attributes,
          listeners,
        },
      })}
    </div>
  );
}

export function LinksDndList<TLink extends DndLink>({
  links,
  onLinksChange,
  onReorder,
  renderLink,
}: {
  links: TLink[];
  onLinksChange: (next: TLink[]) => void;
  onReorder: (orderedIds: string[]) => void;
  renderLink: (
    link: TLink,
    opts: {
      dragHandle: React.ReactNode;
      isDragging: boolean;
    },
  ) => React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(links, oldIndex, newIndex);
    onLinksChange(next);
    onReorder(next.map((l) => l.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={links.map((l) => l.id)}>
        <div className="space-y-4">
          {links.map((link) => (
            <SortableRow key={link.id} id={link.id}>
              {({ handleProps, isDragging }) =>
                renderLink(link, {
                  isDragging,
                  dragHandle: (
                    <button
                      type="button"
                      ref={handleProps.setActivatorNodeRef}
                      className="border-input bg-background hover:bg-accent inline-flex h-9 w-9 items-center justify-center rounded-md border"
                      aria-label="Drag to reorder"
                      {...handleProps.attributes}
                      {...handleProps.listeners}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  ),
                })
              }
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
