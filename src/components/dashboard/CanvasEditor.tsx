
import { useEffect, useRef, useState } from "react";
import { Canvas, TEvent, Text, Rect, Circle } from "fabric";
import { Button } from "@/components/ui/button";
import { Type, Square, Circle as CircleIcon } from "lucide-react";

interface CanvasEditorProps {
  onCanvasReady: (canvas: Canvas) => void;
}

export function CanvasEditor({ onCanvasReady }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
    });

    fabricCanvas.on('object:modified', (e: TEvent<Event>) => {
      console.log('Canvas state updated:', fabricCanvas.toJSON());
    });

    setCanvas(fabricCanvas);
    onCanvasReady(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, [onCanvasReady]);

  const addText = () => {
    if (!canvas) return;
    const text = new Text('Click to edit text', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: '#000000',
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

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button type="button" variant="outline" onClick={addText}>
          <Type className="mr-2 h-4 w-4" />
          Add Text
        </Button>
        <Button type="button" variant="outline" onClick={() => addShape('rectangle')}>
          <Square className="mr-2 h-4 w-4" />
          Add Rectangle
        </Button>
        <Button type="button" variant="outline" onClick={() => addShape('circle')}>
          <CircleIcon className="mr-2 h-4 w-4" />
          Add Circle
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
