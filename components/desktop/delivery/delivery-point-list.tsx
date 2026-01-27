/**
 * Delivery Point List Component
 * Teslimat noktaları listesi
 */

"use client";

import { useState, type CSSProperties } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDeliveryPoints } from "@/contexts/DeliveryPointsContext";
import { DeliveryPointCard } from "./delivery-point-card";
import { DeliveryPointDetailModal } from "./delivery-point-detail-modal";
import type { DeliveryPoint, Priority } from "@/types/delivery.types";

function SortableDeliveryPointItem({
  point,
  order,
  onEdit,
  onDelete,
}: {
  point: DeliveryPoint;
  order: number;
  onEdit: (point: DeliveryPoint) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: point.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "z-50" : ""}>
      <DeliveryPointCard
        point={{ ...point, order }}
        onEdit={onEdit}
        onDelete={onDelete}
        dragEnabled
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function DeliveryPointList() {
  const {
    getSortedDeliveryPoints,
    removeDeliveryPoint,
    updateDeliveryPoint,
    routeType,
    reorderWithinPriority,
  } = useDeliveryPoints();
  const [selectedPoint, setSelectedPoint] = useState<DeliveryPoint | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Route type'a göre sıralanmış teslimat noktaları
  const sortedDeliveryPoints = getSortedDeliveryPoints();
  const isPriorityMode = routeType === "priority";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isPriorityMode) return;

    const { active, over } = event;
    if (!over) return;

    reorderWithinPriority(String(active.id), String(over.id));
  };

  // Düzenleme handler'ı
  const handleEdit = (point: DeliveryPoint) => {
    setSelectedPoint(point);
    setIsModalOpen(true);
  };

  // Modal kaydetme handler'ı
  const handleSave = (
    id: string,
    updates: { priority: Priority; notes?: string },
  ) => {
    updateDeliveryPoint(id, updates);
  };

  // Modal kapatma handler'ı
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPoint(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Liste İçeriği */}
      <div className="flex-1 overflow-y-auto p-4">
        {sortedDeliveryPoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            {/* Empty State Icon */}
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-purple-500 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Henüz rota yok
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Teslimat noktalarınızı ekleyerek rota planlamaya başlayın
            </p>
          </div>
        ) : isPriorityMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedDeliveryPoints.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {sortedDeliveryPoints.map((point, index) => (
                  <SortableDeliveryPointItem
                    key={point.id}
                    point={point}
                    order={index + 1}
                    onEdit={handleEdit}
                    onDelete={removeDeliveryPoint}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="space-y-3">
            {sortedDeliveryPoints.map((point, index) => (
              <DeliveryPointCard
                key={point.id}
                point={{ ...point, order: index + 1 }}
                onEdit={handleEdit}
                onDelete={removeDeliveryPoint}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <DeliveryPointDetailModal
        point={selectedPoint}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
      />
    </div>
  );
}
