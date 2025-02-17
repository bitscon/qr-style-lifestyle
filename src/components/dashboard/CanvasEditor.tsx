
import { useEffect, useRef, useState } from "react";
import { Canvas, TEvent, Text, Rect, Circle, ModifiedEvent, TPointerEvent, IText } from "fabric";
import { Button } from "@/components/ui/button";
import { 
  Type, 
  Square, 
  Circle as CircleIcon,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
  Heading,
  List
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CanvasEditorProps {
  onCanvasReady: (canvas: Canvas) => void;
}

export function CanvasEditor({ onCanvasReady }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<IText | null>(null);
  const [fontSize, setFontSize] = useState("16");

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
    });

    fabricCanvas.on('object:modified', (e: ModifiedEvent<TPointerEvent>) => {
      console.log('Canvas state updated:', fabricCanvas.toJSON());
    });

    fabricCanvas.on('selection:created', (e) => {
      const selected = fabricCanvas.getActiveObject();
      if (selected instanceof Text) {
        setSelectedObject(selected);
        setFontSize(selected.fontSize?.toString() || "16");
      }
    });

    fabricCanvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    setCanvas(fabricCanvas);
    onCanvasReady(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, [onCanvasReady]);

  const addText = (style: 'normal' | 'heading' | 'subheading') => {
    if (!canvas) return;
    
    const fontSize = style === 'heading' ? 32 : style === 'subheading' ? 24 : 16;
    const text = new Text('Click to edit text', {
      left: 100,
      top: 100,
      fontSize,
      fill: '#000000',
      fontFamily: 'Arial',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addShape = (type: 'rectangle' | 'circle') => {
    if (!canvas) return;
    
    const props = {
      left: 100,
      top: 100,
      fill: '#e9ecef',
      width: 100,
      height: 100,
      stroke: '#000000',
      strokeWidth: 1,
    };

    const shape = type === 'rectangle' 
      ? new Rect(props)
      : new Circle({ ...props, radius: 50 });

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  };

  const formatText = (format: 'bold' | 'italic' | 'underline') => {
    if (!selectedObject) return;

    switch (format) {
      case 'bold':
        selectedObject.set('fontWeight', selectedObject.fontWeight === 'bold' ? 'normal' : 'bold');
        break;
      case 'italic':
        selectedObject.set('fontStyle', selectedObject.fontStyle === 'italic' ? 'normal' : 'italic');
        break;
      case 'underline':
        selectedObject.set('underline', !selectedObject.underline);
        break;
    }
    canvas?.renderAll();
  };

  const alignText = (alignment: 'left' | 'center' | 'right') => {
    if (!selectedObject) return;
    selectedObject.set('textAlign', alignment);
    canvas?.renderAll();
  };

  const handleFontSizeChange = (value: string) => {
    if (!selectedObject) return;
    setFontSize(value);
    selectedObject.set('fontSize', parseInt(value));
    canvas?.renderAll();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-lg">
        <div className="flex gap-2 items-center border-r pr-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => addText('heading')}>
            <Heading className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => addText('normal')}>
            <Type className="h-4 w-4" />
          </Button>
          <Select value={fontSize} onValueChange={handleFontSizeChange}>
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 items-center border-r pr-2">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => formatText('bold')}
            className={selectedObject?.fontWeight === 'bold' ? 'bg-accent' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => formatText('italic')}
            className={selectedObject?.fontStyle === 'italic' ? 'bg-accent' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => formatText('underline')}
            className={selectedObject?.underline ? 'bg-accent' : ''}
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2 items-center border-r pr-2">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => alignText('left')}
            className={selectedObject?.textAlign === 'left' ? 'bg-accent' : ''}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => alignText('center')}
            className={selectedObject?.textAlign === 'center' ? 'bg-accent' : ''}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => alignText('right')}
            className={selectedObject?.textAlign === 'right' ? 'bg-accent' : ''}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <Button type="button" variant="ghost" size="sm" onClick={() => addShape('rectangle')}>
            <Square className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => addShape('circle')}>
            <CircleIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
