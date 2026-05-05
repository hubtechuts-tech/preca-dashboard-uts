'use client';

import React, { useState, useMemo } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  useDraggable, 
  useDroppable, 
  DragStartEvent, 
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  Modifier
} from '@dnd-kit/core';
import { 
  SortableContext, 
  useSortable, 
  verticalListSortingStrategy,
  arrayMove 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Type, 
  AlignLeft, 
  Mail, 
  Phone, 
  Hash, 
  Calendar, 
  List, 
  CheckSquare, 
  ToggleLeft, 
  FileUp, 
  GripVertical, 
  Trash2, 
  Plus, 
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { FormSchemaJSON, FormFieldJSON, FieldType } from '@/domain/value-objects/FormSchema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// --- Types & Constants ---

interface FormSchemaBuilderProps {
  initialSchema?: FormSchemaJSON;
  onSchemaChange: (schema: FormSchemaJSON) => void;
}

const FIELD_TYPES = [
  { type: 'text', label: 'Texto Corto', icon: Type, description: 'Una sola línea de texto' },
  { type: 'textarea', label: 'Párrafo', icon: AlignLeft, description: 'Múltiples líneas de texto' },
  { type: 'email', label: 'Email', icon: Mail, description: 'Dirección de correo electrónico' },
  { type: 'tel', label: 'Teléfono', icon: Phone, description: 'Número telefónico' },
  { type: 'number', label: 'Número', icon: Hash, description: 'Valor numérico' },
  { type: 'date', label: 'Fecha', icon: Calendar, description: 'Selector de fecha' },
  { type: 'select', label: 'Selección', icon: List, description: 'Menú desplegable' },
  { type: 'checkbox', label: 'Casilla', icon: CheckSquare, description: 'Selección múltiple' },
  { type: 'boolean', label: 'Switch', icon: ToggleLeft, description: 'Sí o No' },
  { type: 'file', label: 'Archivo', icon: FileUp, description: 'Subida de archivos' },
] as const;

type FieldTypeConfig = typeof FIELD_TYPES[number];

// --- Sub-Components ---

// 1. Toolbox Item (Draggable Source)
const ToolboxItem = ({ typeConfig }: { typeConfig: FieldTypeConfig }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `toolbox-${typeConfig.type}`,
    data: {
      isToolboxItem: true,
      type: typeConfig.type,
      config: typeConfig
    }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/50 hover:bg-accent/50 hover:border-accent transition-all cursor-grab active:cursor-grabbing group shadow-sm",
        isDragging && "opacity-50 ring-2 ring-primary/20"
      )}
    >
      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <typeConfig.icon className="w-5 h-5" />
      </div>
      <div>
        <p className="font-medium text-sm text-foreground/90">{typeConfig.label}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">{typeConfig.description}</p>
      </div>
    </div>
  );
};

// 2. Canvas Field (Sortable Item)
const CanvasField = ({ 
  field, 
  isSelected, 
  onSelect, 
  onDelete 
}: { 
  field: FormFieldJSON; 
  isSelected: boolean; 
  onSelect: () => void; 
  onDelete: (e: React.MouseEvent) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id, data: { field } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const TypeIcon = FIELD_TYPES.find(t => t.type === field.type)?.icon || Type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group mb-3 rounded-xl border-2 transition-all duration-200",
        isSelected 
          ? "border-primary bg-primary/5 shadow-md" 
          : "border-transparent hover:border-muted-foreground/20 bg-card shadow-sm hover:shadow-md",
        isDragging && "opacity-30 scale-95"
      )}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="pl-10 pr-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground/80">{field.label}</span>
            {field.required && <Badge variant="destructive" className="text-[10px] h-4 px-1">Requerido</Badge>}
          </div>
          <div className="flex items-center gap-2">
             <Badge variant="secondary" className="text-[10px] font-mono opacity-50">{field.type}</Badge>
             <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive/50 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(e);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
          </div>
        </div>

        {/* Visual Mock of the Field (Read-only) */}
        <div className="pointer-events-none opacity-80">
          {['text', 'email', 'tel', 'number', 'date', 'file'].includes(field.type) && (
            <div className="h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 flex items-center text-sm text-muted-foreground">
              {field.placeholder || `Ingresa ${field.label.toLowerCase()}...`}
            </div>
          )}
          {field.type === 'textarea' && (
             <div className="h-16 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-muted-foreground">
               {field.placeholder || 'Escribe aquí...'}
             </div>
          )}
          {(field.type === 'select' || field.type === 'checkbox' ||  field.type === 'boolean') && (
            <div className="h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 flex items-center justify-between text-sm text-muted-foreground">
               <span>Seleccionar opción...</span>
               <List className="w-4 h-4 opacity-50" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 3. Properties Panel
const FieldProperties = ({ 
  field, 
  onChange 
}: { 
  field: FormFieldJSON; 
  onChange: (updates: Partial<FormFieldJSON>) => void;
}) => {
  if (!field) return null;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Identificación</Label>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="prop-label" className="text-sm mb-1.5 block">Etiqueta (Label)</Label>
              <Input 
                id="prop-label" 
                value={field.label} 
                onChange={(e) => onChange({ label: e.target.value })} 
                className="bg-background/50"
              />
            </div>
            <div>
              <Label htmlFor="prop-name" className="text-sm mb-1.5 block">Nombre Interno (Key)</Label>
              <Input 
                id="prop-name" 
                value={field.name} 
                onChange={(e) => onChange({ name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                className="font-mono text-xs bg-background/50" 
              />
            </div>
          </div>
        </div>
        
        <Separator />

        <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Configuración</Label>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card/30">
                <Label htmlFor="prop-required" className="cursor-pointer">Campo Requerido</Label>
                <Switch 
                  id="prop-required" 
                  checked={field.required}
                  onCheckedChange={(checked) => onChange({ required: checked })}
                />
            </div>
        </div>

        <div className="space-y-3">
             <Label htmlFor="prop-placeholder" className="text-sm">Placeholder</Label>
             <Input 
               id="prop-placeholder"
               value={field.placeholder || ''}
               onChange={(e) => onChange({ placeholder: e.target.value })}
               placeholder="Texto de ayuda visual..."
             />
        </div>

        {['select', 'checkbox', 'radio'].includes(field.type) && (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm">Opciones</Label>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs"
                        onClick={() => {
                            const newOption = { value: `option_${(field.options?.length || 0) + 1}`, label: 'Nueva Opción' };
                            onChange({ options: [...(field.options || []), newOption] });
                        }}
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        Agregar
                    </Button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {field.options?.map((opt, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <Input 
                                value={opt.label}
                                onChange={(e) => {
                                    const newOpts = [...(field.options || [])];
                                    newOpts[idx].label = e.target.value;
                                    // Auto-update value if simplistic
                                    if(newOpts[idx].value === `option_${idx+1}`) {
                                        newOpts[idx].value = e.target.value.toLowerCase().replace(/\s/g, '_');
                                    }
                                    onChange({ options: newOpts });
                                }}
                                className="h-8 text-sm"
                                placeholder="Etiqueta"
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                    const newOpts = field.options?.filter((_, i) => i !== idx);
                                    onChange({ options: newOpts });
                                }}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    ))}
                    {!field.options?.length && (
                        <div className="text-xs text-center text-muted-foreground py-2 italic">
                            No hay opciones definidas
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

// 4. Canvas Area Component
const CanvasArea = ({ 
  fields, 
  selectedFieldId, 
  onSelectField, 
  onDeleteField, 
  activeDragItem 
}: {
  fields: FormFieldJSON[];
  selectedFieldId: string | null;
  onSelectField: (id: string) => void;
  onDeleteField: (id: string, e: React.MouseEvent) => void;
  activeDragItem: any;
}) => {
  const { setNodeRef } = useDroppable({ id: 'canvas-droppable' });

  return (
    <div className="flex-1 bg-muted/30 rounded-2xl border-2 border-dashed border-muted-foreground/10 p-4 overflow-hidden relative">
      <ScrollArea className="h-full pr-4">
        <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
          <div 
            ref={setNodeRef}
            id="canvas-droppable" 
            className={cn(
                "min-h-[500px] max-w-2xl mx-auto space-y-4 p-8 bg-background shadow-sm rounded-xl transition-colors",
                activeDragItem?.isToolboxItem && "bg-primary/5 ring-2 ring-primary/10 ring-inset"
            )}
          >
                {fields.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-muted rounded-xl bg-muted/20">
                          <FileUp className="w-12 h-12 mb-4 opacity-20" />
                          <p className="text-lg font-medium">Tu formulario está vacío</p>
                          <p className="text-sm opacity-60">Arrastra elementos desde la izquierda para comenzar</p>
                    </div>
                ) : (
                    fields.map(field => (
                        <CanvasField 
                          key={field.id} 
                          field={field} 
                          isSelected={selectedFieldId === field.id}
                          onSelect={() => onSelectField(field.id)}
                          onDelete={(e) => onDeleteField(field.id, e)}
                        />
                    ))
                )}
                {/* Spacer for easier dropping at bottom */}
                {fields.length > 0 && <div className="h-20" />}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
};

// 5. Form Preview Component
const FormPreview = ({ fields }: { fields: FormFieldJSON[] }) => {
  return (
    <div className="space-y-4 py-4">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            
            {field.type === 'textarea' ? (
                <Textarea placeholder={field.placeholder} disabled className="resize-none" />
            ) : field.type === 'select' ? (
                <Select disabled>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options?.map((opt, i) => (
                            <SelectItem key={i} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : field.type === 'checkbox' ? (
                 <div className="space-y-2">
                     {field.options?.map((opt, i) => (
                         <div key={i} className="flex items-center gap-2">
                             <CheckSquare className="w-4 h-4 text-muted-foreground" />
                             <Label className="font-normal">{opt.label}</Label>
                         </div>
                     ))}
                 </div>
            ) : field.type === 'boolean' ? (
                 <div className="flex items-center gap-2">
                    <Switch id={`preview-${field.id}`} disabled />
                    <Label htmlFor={`preview-${field.id}`} className="font-normal">Sí</Label>
                 </div>
            ) : field.type === 'file' ? (
                 <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground bg-muted/50">
                     <FileUp className="w-8 h-8 mb-2 opacity-50" />
                     <span className="text-sm">Arrastra un archivo o haz clic para subir</span>
                 </div>
            ) : (
                <Input type={field.type} placeholder={field.placeholder} disabled />
            )}

            {field.helpText && (
                <p className="text-[0.8rem] text-muted-foreground">{field.helpText}</p>
            )}
        </div>
      ))}
      <Button className="w-full mt-6" disabled>Enviar Formulario</Button>
    </div>
  );
};

// --- Main Component ---

import {
  AnimatedDialog as Dialog,
  AnimatedDialogContent as DialogContent,
  AnimatedDialogHeader as DialogHeader,
  AnimatedDialogTitle as DialogTitle,
  AnimatedDialogTrigger as DialogTrigger,
  AnimatedDialogDescription as DialogDescription,
  AnimatedDialogFooter as DialogFooter,
} from '@/components/ui/animated-dialog';

export function FormSchemaBuilder({ initialSchema, onSchemaChange }: FormSchemaBuilderProps) {
  const [fields, setFields] = useState<FormFieldJSON[]>(initialSchema?.fields || []);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<any>(null); // For drag overlay
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const selectedField = useMemo(() => fields.find(f => f.id === selectedFieldId), [fields, selectedFieldId]);

  // --- Handlers ---
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragItem(event.active.data.current);
  };

  const handleDragOver = (event: DragOverEvent) => {
     // Optional: Implementation for more complex visual feedback during drag
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    // Case 1: Dropping a Toolbox Item into the Canvas
    if (active.data.current?.isToolboxItem && over.id === 'canvas-droppable') {
       const type = active.data.current.type;
       const newField: FormFieldJSON = {
           id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
           type: type as any,
           name: `new_${type}_${fields.length + 1}`,
           label: `Nuevo ${type === 'text' ? 'Campo de Texto' : type.charAt(0).toUpperCase() + type.slice(1)}`,
           required: false,
           order: fields.length,
           options: ['select', 'radio', 'checkbox'].includes(type) ? [{ label: 'Opción 1', value: 'opcion_1' }] : undefined
       };
       
       const newFields = [...fields, newField];
       setFields(newFields);
       onSchemaChange({ version: '1.0', fields: newFields });
       setSelectedFieldId(newField.id);
       return;
    }

    // Case 2: Reordering items in the Canvas
    if (active.id !== over.id && !active.data.current?.isToolboxItem) {
        // Calculate new fields first based on current state 'fields'
        const oldIndex = fields.findIndex((item) => item.id === active.id);
        const newIndex = fields.findIndex((item) => item.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
             const newFields = arrayMove(fields, oldIndex, newIndex).map((f, i) => ({ ...f, order: i }));
             setFields(newFields);
             onSchemaChange({ version: '1.0', fields: newFields });
        }
    }
  };

  const handleDeleteField = (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const newFields = fields.filter(f => f.id !== id);
      setFields(newFields);
      onSchemaChange({ version: '1.0', fields: newFields });
      if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const handleUpdateField = (updates: Partial<FormFieldJSON>) => {
      if (!selectedFieldId) return;
      
      const newFields = fields.map(f => f.id === selectedFieldId ? { ...f, ...updates } : f);
      setFields(newFields);
      onSchemaChange({ version: '1.0', fields: newFields });
  };

  // --- Render ---

  return (
    <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
    >
        <div className="flex flex-col md:flex-row h-full gap-4 md:gap-6 p-2 md:p-4 bg-muted/10">
            
            {/* Left Panel: Toolbox - Mobile: Horizontal Scroll, Desktop: Vertical */}
            <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
                <Card className="h-auto md:h-full border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0 pb-2 md:pb-4">
                        <CardTitle className="text-base md:text-lg font-bold">Herramientas</CardTitle>
                        <CardDescription className="text-xs md:text-sm">Arrastra campos</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 md:overflow-y-auto md:h-full pb-2 md:pb-10">
                         <div className="flex md:grid md:gap-3 gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide">
                             {FIELD_TYPES.map((type) => (
                                 <div key={type.type} className="min-w-[140px] md:min-w-0">
                                    <ToolboxItem typeConfig={type} />
                                 </div>
                             ))}
                         </div>
                    </CardContent>
                </Card>
            </div>

            {/* Center Panel: Canvas */}
            <div className="flex-1 flex flex-col min-h-0">
                 <div className="flex items-center justify-between mb-4 md:mb-4">
                     <div className="md:hidden font-semibold">Lienzo</div>
                     <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                         <DialogTrigger asChild>
                            <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary">
                                <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Vista Previa</span>
                            </Button>
                         </DialogTrigger>
                         <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                             <DialogHeader>
                                 <DialogTitle>Vista Previa del Formulario</DialogTitle>
                                 <DialogDescription>
                                     Así es como verán el formulario tus usuarios.
                                 </DialogDescription>
                             </DialogHeader>
                             <FormPreview fields={fields} />
                         </DialogContent>
                     </Dialog>
                 </div>

                 <CanvasArea 
                    fields={fields} 
                    selectedFieldId={selectedFieldId} 
                    onSelectField={setSelectedFieldId} 
                    onDeleteField={handleDeleteField}
                    activeDragItem={activeDragItem}
                 />
            </div>

            {/* Right Panel: Properties - Hidden on mobile if no selection, or bottom sheet style */}
            {selectedField && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setSelectedFieldId(null)} />
            )}
            <div className={cn(
                "fixed inset-y-0 right-0 z-50 w-80 bg-background shadow-2xl p-4 transform transition-transform duration-300 md:relative md:transform-none md:w-80 md:shadow-none md:p-0 md:bg-transparent md:block",
                selectedField ? "translate-x-0" : "translate-x-full md:translate-x-0"
            )}>
                 <div className="md:hidden flex justify-end mb-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFieldId(null)}>Cerrar</Button>
                 </div>
                 <Card className="h-full border-l border-y-0 border-r-0 rounded-none shadow-none bg-transparent">
                     <CardHeader className="pt-2 px-0">
                         <CardTitle className="text-base text-foreground/80">
                             {selectedField ? 'Editar Campo' : 'Propiedades'}
                         </CardTitle>
                     </CardHeader>
                     <CardContent className="h-[calc(100%-60px)] overflow-y-auto px-0 md:pr-2 scrollbar-none">
                         {selectedField ? (
                             <FieldProperties 
                                field={selectedField}
                                onChange={handleUpdateField}
                             />
                         ) : (
                             <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-4">
                                  <GripVertical className="w-10 h-10 mb-3 opacity-20" />
                                  <p className="text-sm">Selecciona un campo para editar</p>
                             </div>
                         )}
                     </CardContent>
                 </Card>
            </div>
        </div>

        {/* Drag Overlay used so users see what they are dragging */}
        <DragOverlay>
            {activeDragItem ? (
                activeDragItem.isToolboxItem ? (
                     <div className="flex items-center gap-3 p-3 rounded-xl border border-primary bg-background shadow-xl opacity-90 w-64 cursor-grabbing">
                        <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                            {/* We re-find the icon since we only stored the type in data to avoid serialization issues if any */}
                            {React.createElement(activeDragItem.config.icon, { className: "w-5 h-5" })}
                        </div>
                        <span className="font-medium bg-transparent">{activeDragItem.config.label}</span>
                     </div>
                ) : null // We could implement overlay for sortable items too but usually Sortable handles it with the helperClass or style
            ) : null}
        </DragOverlay>
    </DndContext>
  );
}
