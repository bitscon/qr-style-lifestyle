import { useEffect, useRef, useState } from "react";
import { Canvas, Text as FabricText, Rect, Circle, ModifiedEvent, TPointerEvent, Image, Triangle, Path } from "fabric";
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
  Palette,
  Undo2,
  Redo2,
  Triangle as TriangleIcon,
  Pentagon,
  Hexagon,
  Octagon,
  Star,
  Heart,
  Diamond,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CanvasEditorProps {
  onCanvasReady: (canvas: Canvas) => void;
  initialData?: Record<string, any>;
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

const shapes = [
  { name: 'Square', icon: Square },
  { name: 'Rectangle', icon: Square },
  { name: 'Circle', icon: CircleIcon },
  { name: 'Triangle', icon: TriangleIcon },
  { name: 'Pentagon', icon: Pentagon },
  { name: 'Hexagon', icon: Hexagon },
  { name: 'Octagon', icon: Octagon },
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
  { name: 'Diamond', icon: Diamond },
  { name: 'Arrow Up', icon: ArrowUp },
  { name: 'Arrow Down', icon: ArrowDown },
  { name: 'Arrow Left', icon: ArrowLeft },
  { name: 'Arrow Right', icon: ArrowRight }
];

export function CanvasEditor({ onCanvasReady, initialData }: CanvasEditorProps) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricText | null>(null);
  const [fontSize, setFontSize] = useState("16");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [textColor, setTextColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const stateStackRef = useRef<string[]>([]);
  const currentStateIndexRef = useRef(-1);

  useEffect(() => {
    console.log("CanvasEditor: Initializing with data:", initialData);
    
    if (!canvasEl.current) {
      console.log("CanvasEditor: Canvas element not ready");
      return;
    }

    const fabricCanvas = new Canvas(canvasEl.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
    });

    console.log("CanvasEditor: Canvas created, loading initial data");

    if (initialData && Object.keys(initialData).length > 0) {
      console.log("CanvasEditor: Loading initial data into canvas");
      fabricCanvas.loadFromJSON(initialData, () => {
        console.log("CanvasEditor: Initial data loaded successfully");
        fabricCanvas.renderAll();
      });
    } else {
      console.log("CanvasEditor: No initial data to load");
    }

    fabricCanvas.on('mouse:dblclick', (options) => {
      if (options.target && options.target instanceof FabricText) {
        fabricCanvas.setActiveObject(options.target);
        options.target.set({ isEditing: true });
        fabricCanvas.requestRenderAll();
      }
    });

    fabricCanvas.on('object:modified', (e: ModifiedEvent<TPointerEvent>) => {
      saveState(fabricCanvas);
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

    saveState(fabricCanvas);
    setCanvas(fabricCanvas);
    onCanvasReady(fabricCanvas);

    return () => {
      console.log("CanvasEditor: Disposing canvas");
      fabricCanvas.dispose();
    };
  }, [onCanvasReady, initialData]);

  const saveState = (fabricCanvas: Canvas) => {
    const json = JSON.stringify(fabricCanvas.toJSON());
    currentStateIndexRef.current++;
    
    stateStackRef.current = stateStackRef.current.slice(0, currentStateIndexRef.current);
    stateStackRef.current.push(json);
    
    setCanUndo(currentStateIndexRef.current > 0);
    setCanRedo(false);
  };

  const undo = () => {
    if (!canvas || currentStateIndexRef.current <= 0) return;
    
    currentStateIndexRef.current--;
    const previousState = stateStackRef.current[currentStateIndexRef.current];
    canvas.loadFromJSON(JSON.parse(previousState), () => {
      canvas.renderAll();
      setCanUndo(currentStateIndexRef.current > 0);
      setCanRedo(currentStateIndexRef.current < stateStackRef.current.length - 1);
    });
  };

  const redo = () => {
    if (!canvas || currentStateIndexRef.current >= stateStackRef.current.length - 1) return;
    
    currentStateIndexRef.current++;
    const nextState = stateStackRef.current[currentStateIndexRef.current];
    canvas.loadFromJSON(JSON.parse(nextState), () => {
      canvas.renderAll();
      setCanUndo(currentStateIndexRef.current > 0);
      setCanRedo(currentStateIndexRef.current < stateStackRef.current.length - 1);
    });
  };

  const addText = (style: 'normal' | 'heading' | 'subheading' | 'list' | 'ordered-list') => {
    if (!canvas) return;
    
    let text;
    const baseTextProps = {
      left: 100,
      top: 100,
      fill: textColor,
      fontFamily,
      editable: true,
      selectable: true,
      borderColor: '#2196F3',
      padding: 5,
      cursorColor: '#2196F3',
      cursorWidth: 2,
      editingBorderColor: '#2196F3'
    };
    
    switch (style) {
      case 'heading':
        text = new FabricText('Heading', {
          ...baseTextProps,
          fontSize: 32,
          fontWeight: 'bold'
        });
        break;
      case 'list':
        text = new FabricText('• List item\n• List item\n• List item', {
          ...baseTextProps,
          fontSize: 16,
          lineHeight: 1.5
        });
        break;
      case 'ordered-list':
        text = new FabricText('1. List item\n2. List item\n3. List item', {
          ...baseTextProps,
          fontSize: 16,
          lineHeight: 1.5
        });
        break;
      default:
        text = new FabricText('Click to edit text', {
          ...baseTextProps,
          fontSize: style === 'subheading' ? 24 : 16
        });
    }
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveState(canvas);
  };

  const addShape = (shapeName: string) => {
    if (!canvas) return;
    
    const baseProps = {
      left: 100,
      top: 100,
      fill: backgroundColor,
      stroke: '#000000',
      strokeWidth: 1,
    };

    let shape;
    
    switch (shapeName.toLowerCase()) {
      case 'square':
        shape = new Rect({
          ...baseProps,
          width: 100,
          height: 100,
        });
        break;
      case 'rectangle':
        shape = new Rect({
          ...baseProps,
          width: 150,
          height: 100,
        });
        break;
      case 'circle':
        shape = new Circle({
          ...baseProps,
          radius: 50,
        });
        break;
      case 'triangle':
        shape = new Triangle({
          ...baseProps,
          width: 100,
          height: 100,
        });
        break;
      case 'pentagon':
        shape = new Path([
          ['M', 50, 0],
          ['L', 100, 40],
          ['L', 80, 100],
          ['L', 20, 100],
          ['L', 0, 40],
          ['Z']
        ], {
          ...baseProps
        });
        break;
      case 'hexagon':
        shape = new Path([
          ['M', 50, 0],
          ['L', 100, 25],
          ['L', 100, 75],
          ['L', 50, 100],
          ['L', 0, 75],
          ['L', 0, 25],
          ['Z']
        ], {
          ...baseProps
        });
        break;
      case 'star':
        shape = new Path([
          ['M', 50, 0],
          ['L', 61, 35],
          ['L', 97, 35],
          ['L', 68, 57],
          ['L', 79, 91],
          ['L', 50, 70],
          ['L', 21, 91],
          ['L', 32, 57],
          ['L', 3, 35],
          ['L', 39, 35],
          ['Z']
        ], {
          ...baseProps
        });
        break;
      case 'heart':
        shape = new Path([
          ['M', 50, 90],
          ['C', 25, 70, 0, 50, 0, 25],
          ['C', 0, 10, 10, 0, 25, 0],
          ['S', 50, 10, 50, 25],
          ['C', 50, 10, 65, 0, 75, 0],
          ['S', 100, 10, 100, 25],
          ['C', 100, 50, 75, 70, 50, 90],
          ['Z']
        ], {
          ...baseProps
        });
        break;
      case 'diamond':
        shape = new Path([
          ['M', 50, 0],
          ['L', 100, 50],
          ['L', 50, 100],
          ['L', 0, 50],
          ['Z']
        ], {
          ...baseProps
        });
        break;
      case 'arrow up':
      case 'arrow down':
      case 'arrow left':
      case 'arrow right':
        const arrowPaths = {
          'arrow up': [
            ['M', 50, 0],
            ['L', 100, 50],
            ['L', 75, 50],
            ['L', 75, 100],
            ['L', 25, 100],
            ['L', 25, 50],
            ['L', 0, 50],
            ['Z']
          ],
          'arrow down': [
            ['M', 50, 100],
            ['L', 100, 50],
            ['L', 75, 50],
            ['L', 75, 0],
            ['L', 25, 0],
            ['L', 25, 50],
            ['L', 0, 50],
            ['Z']
          ],
          'arrow left': [
            ['M', 0, 50],
            ['L', 50, 100],
            ['L', 50, 75],
            ['L', 100, 75],
            ['L', 100, 25],
            ['L', 50, 25],
            ['L', 50, 0],
            ['Z']
          ],
          'arrow right': [
            ['M', 100, 50],
            ['L', 50, 100],
            ['L', 50, 75],
            ['L', 0, 75],
            ['L', 0, 25],
            ['L', 50, 25],
            ['L', 50, 0],
            ['Z']
          ]
        };
        shape = new Path(arrowPaths[shapeName.toLowerCase()], {
          ...baseProps
        });
        break;
      default:
        shape = new Rect({
          ...baseProps,
          width: 100,
          height: 100,
        });
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    saveState(canvas);
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
      saveState(canvas);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      Image.fromURL(imgUrl).then((img) => {
        img.scaleToWidth(200);
        canvas.add(img);
        canvas.renderAll();
        saveState(canvas);
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
    saveState(canvas);
  };

  const alignText = (alignment: 'left' | 'center' | 'right') => {
    if (!selectedObject) return;
    selectedObject.set('textAlign', alignment);
    canvas?.renderAll();
    saveState(canvas);
  };

  const handleFontSizeChange = (value: string) => {
    if (!selectedObject) return;
    setFontSize(value);
    selectedObject.set('fontSize', parseInt(value));
    canvas?.renderAll();
    saveState(canvas);
  };

  const handleFontFamilyChange = (value: string) => {
    if (!selectedObject) return;
    setFontFamily(value);
    selectedObject.set('fontFamily', value);
    canvas?.renderAll();
    saveState(canvas);
  };

  const handleColorChange = (color: string, type: 'text' | 'background') => {
    if (type === 'text') {
      setTextColor(color);
      if (selectedObject) {
        selectedObject.set('fill', color);
        canvas?.renderAll();
        saveState(canvas);
      }
    } else {
      setBackgroundColor(color);
      if (canvas) {
        canvas.backgroundColor = color;
        canvas.renderAll();
        saveState(canvas);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-lg">
        <div className="flex gap-2 items-center border-r pr-2">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={undo}
            disabled={!canUndo}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={redo}
            disabled={!canRedo}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Square className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Shapes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {shapes.map((shape) => (
                <DropdownMenuItem
                  key={shape.name}
                  onClick={() => addShape(shape.name)}
                  className="flex items-center gap-2"
                >
                  <shape.icon className="h-4 w-4" />
                  <span>{shape.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <canvas ref={canvasEl} />
      </div>
    </div>
  );
}
