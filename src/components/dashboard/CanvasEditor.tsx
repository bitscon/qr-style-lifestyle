
import { useEffect, useRef, useState } from "react";
import { Canvas, Text as FabricText, Rect, Circle, ModifiedEvent, TPointerEvent, Image } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Link2,
  Image as ImageIcon,
  Heading,
  List,
  ListOrdered,
  Palette
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CanvasEditorProps {
  onCanvasReady: (canvas: Canvas) => void;
}

const fontFamilies = [
  'Arial',
  'Times New Roman',
  'Helvetica',
  'Georgia',
  'Courier New',
  'Verdana',
  'Tahoma'
];

export function CanvasEditor({ onCanvasReady }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricText | null>(null);
  const [fontSize, setFontSize] = useState("16");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [textColor, setTextColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (selected instanceof FabricText) {
        setSelectedObject(selected);
        setFontSize(selected.fontSize?.toString() || "16");
        setFontFamily(selected.fontFamily || "Arial");
        setTextColor(selected.fill?.toString() || "#000000");
      } else {
        setSelectedObject(null);
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

  const addText = (style: 'normal' | 'heading' | 'subheading' | 'list' | 'ordered-list') => {
    if (!canvas) return;
    
    let text;
    
    switch (style) {
      case 'heading':
        text = new FabricText('Heading', {
          left: 100,
          top: 100,
          fontSize: 32,
          fontWeight: 'bold',
          fill: textColor,
          fontFamily,
        });
        break;
      case 'list':
        text = new FabricText('• List item\n• List item\n• List item', {
          left: 100,
          top: 100,
          fontSize: 16,
          fill: textColor,
          fontFamily,
          lineHeight: 1.5,
        });
        break;
      case 'ordered-list':
        text = new FabricText('1. List item\n2. List item\n3. List item', {
          left: 100,
          top: 100,
          fontSize: 16,
          fill: textColor,
          fontFamily,
          lineHeight: 1.5,
        });
        break;
      default:
        text = new FabricText('Click to edit text', {
          left: 100,
          top: 100,
          fontSize: style === 'subheading' ? 24 : 16,
          fill: textColor,
          fontFamily,
        });
    }
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addShape = (type: 'rectangle' | 'circle') => {
    if (!canvas) return;
    
    const props = {
      left: 100,
      top: 100,
      fill: backgroundColor,
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

  const addLink = () => {
    if (!selectedObject || !(selectedObject instanceof FabricText)) return;
    
    const url = prompt('Enter URL:', 'https://');
    if (url) {
      selectedObject.set({
        underline: true,
        fill: '#0000EE', // Default link color
      });
      canvas?.renderAll();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      Image.fromURL(imgUrl, (img) => {
        img.scaleToWidth(200); // Scale image to reasonable size
        canvas.add(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
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

  const handleFontFamilyChange = (value: string) => {
    if (!selectedObject) return;
    setFontFamily(value);
    selectedObject.set('fontFamily', value);
    canvas?.renderAll();
  };

  const handleColorChange = (color: string, type: 'text' | 'background') => {
    if (type === 'text') {
      setTextColor(color);
      if (selectedObject) {
        selectedObject.set('fill', color);
        canvas?.renderAll();
      }
    } else {
      setBackgroundColor(color);
      if (canvas) {
        canvas.backgroundColor = color;
        canvas.renderAll();
      }
    }
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
          <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map((font) => (
                <SelectItem key={font} value={font}>
                  {font}
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

        <div className="flex gap-2 items-center border-r pr-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => addText('list')}>
            <List className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => addText('ordered-list')}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={addLink}>
            <Link2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon className="h-4 w-4" />
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>

        <div className="flex gap-2 items-center border-r pr-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium">Text Color</label>
                  <Input
                    type="color"
                    value={textColor}
                    onChange={(e) => handleColorChange(e.target.value, 'text')}
                    className="h-8 w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Background Color</label>
                  <Input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => handleColorChange(e.target.value, 'background')}
                    className="h-8 w-full"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
