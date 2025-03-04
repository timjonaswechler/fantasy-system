import React, { useState, useRef, useEffect } from "react";

interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  showAlpha?: boolean;
  showHue?: boolean;
  showColorPreview?: boolean;
  showInputs?: boolean;
  showEyeDropper?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  value = "#B65050",
  onChange,
  showAlpha = false,
  showHue = false,
  showColorPreview = false,
  showInputs = false,
}) => {
  const [color, setColor] = useState(value);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [lightness, setLightness] = useState(0);
  const [alpha, setAlpha] = useState(1);

  const colorAreaRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);
  const alphaSliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    updateColorFromHex(value);
  }, [value]);

  const updateColorFromHex = (hexColor: string) => {
    // Convert hex to HSL
    let r,
      g,
      b,
      a = 1;
    if (hexColor.length === 9) {
      r = parseInt(hexColor.slice(1, 3), 16) / 255;
      g = parseInt(hexColor.slice(3, 5), 16) / 255;
      b = parseInt(hexColor.slice(5, 7), 16) / 255;
      a = parseInt(hexColor.slice(7, 9), 16) / 255;
    } else {
      r = parseInt(hexColor.slice(1, 3), 16) / 255;
      g = parseInt(hexColor.slice(3, 5), 16) / 255;
      b = parseInt(hexColor.slice(5, 7), 16) / 255;
    }

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    let h = 0,
      s = 0;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    setHue(h * 360);
    setSaturation(s * 100);
    setLightness(l * 100);
    setAlpha(a);
  };

  const handleColorAreaChange = (event: React.MouseEvent<HTMLDivElement>) => {
    if (colorAreaRef.current) {
      const rect = colorAreaRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setSaturation((x / rect.width) * 100);
      setLightness(100 - (y / rect.height) * 100);
      updateColor();
    }
  };

  const handleHueChange = (event: React.MouseEvent<HTMLDivElement>) => {
    if (hueSliderRef.current) {
      const rect = hueSliderRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      setHue((x / rect.width) * 360);
      updateColor();
    }
  };

  const handleAlphaChange = (event: React.MouseEvent<HTMLDivElement>) => {
    if (alphaSliderRef.current) {
      const rect = alphaSliderRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      setAlpha(x / rect.width);
      updateColor();
    }
  };

  const updateColor = () => {
    const hslColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    const hexColor = hslToHex(hue, saturation, lightness, alpha);
    setColor(hexColor);
    if (onChange) {
      onChange(hexColor);
    }
  };

  const hslToHex = (h: number, s: number, l: number, a: number): string => {
    l /= 100;
    const a1 = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a1 * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    const alphaHex = Math.round(a * 255)
      .toString(16)
      .padStart(2, "0");
    return `#${f(0)}${f(8)}${f(4)}${a < 1 ? alphaHex : ""}`;
  };

  const handleEyeDropper = async () => {
    if ("EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        updateColorFromHex(result.sRGBHex);
        updateColor();
      } catch (error) {
        console.error("EyeDropper error:", error);
      }
    } else {
      console.warn("EyeDropper API is not supported in this browser");
    }
  };

  return (
    <div className="w-60 flex flex-col">
      <div
        ref={colorAreaRef}
        className="relative h-[130px] w-full cursor-crosshair"
        style={{
          background: `linear-gradient(0deg, #000, transparent), linear-gradient(90deg, #fff, hsl(${hue}, 100%, 50%))`,
        }}
        onClick={handleColorAreaChange}
      >
        <div
          className="absolute h-4 w-4 rounded-full bg-white shadow-md"
          style={{
            left: `${saturation}%`,
            top: `${100 - lightness}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
      <div className="flex flex-row items-center gap-2.5 p-4">
        {showColorPreview && (
          <div
            className="w-7 h-7 rounded-full shadow-inner"
            style={{ backgroundColor: color }}
          />
        )}
        <div className="flex-1">
          {showHue && (
            <div
              ref={hueSliderRef}
              className="h-4 w-full rounded-md cursor-pointer"
              style={{
                background:
                  "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
              }}
              onClick={handleHueChange}
            />
          )}
          {showAlpha && (
            <div
              ref={alphaSliderRef}
              className="h-4 w-full rounded-md cursor-pointer mt-2"
              style={{
                background: `linear-gradient(to right, transparent, ${color})`,
              }}
              onClick={handleAlphaChange}
            />
          )}
        </div>
      </div>
      {showInputs && (
        <div className="px-4 pb-4 flex items-center">
          <input
            type="text"
            className="flex-1 border p-1 text-center text-xs"
            value={color}
            onChange={(e) => updateColorFromHex(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
