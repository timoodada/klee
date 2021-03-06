import { CropData, HSV, RGB, Bitmap, Area } from '../models';

export function average(list: number[]) {
  return list.reduce((p, c) => p + c, 0) / list.length;
}

/**
 * @description 获取图片某一点的RGB通道值
 */
export function getRGB(bitmap: Bitmap, x: number, y: number): RGB {
  const base = x * 4 + y * bitmap.width * 4;
  const r = bitmap.image[base]; // red
  const g = bitmap.image[base + 1]; // green
  const b = bitmap.image[base + 2]; // blue
  return { r, g, b };
}

/**
 * @description h:色调,s:饱和度,v:明度
 */
export function rgb2hsv(rgb: RGB[]): HSV[] {
  return rgb.map(({ r, g, b }) => {
    const rabs = r / 255;
    const gabs = g / 255;
    const babs = b / 255;
    const max = Math.max(rabs, gabs, babs);
    const min = Math.min(rabs, gabs, babs);
    const v = max * 100;
    let s = max > 0 ? (max - min) / max * 100 : 100;
    let h!: number;
    if (rabs === max) {
      h = (gabs - babs) / (max - min) * 60;
    }
    if (gabs === max) {
      h = 120 + (babs - rabs) / (max - min) * 60;
    }
    if (babs === max) {
      h = 240 + (rabs - gabs) / (max - min) * 60;
    }
    if (h < 0) {
      h = h + 360;
    }
    if (isNaN(h)) {
      h = 0;
    }
    return { h, s, v };
  });
}

/**
 * @description 灰度化处理图片
 */
export function grayscale(vector: RGB[]): number[] {
  return vector.map(v => 0.3 * v.r + 0.59 * v.g + 0.11 * v.b);
}

export function lightness(rgb: RGB[]) {
  return average(rgb2hsv(rgb).map(v => v.v)) / 100;
}

/**
 * @description 切割图片，宽高等分
 */
const CUT_WIDTH = 8;
const CUT_HEIGHT = 8;
export function cutPicture(crop: CropData, bitmap: Bitmap): RGB[] {
  const rgb: RGB[] = [];
  const perWidth = crop.width / CUT_WIDTH;
  const perHeight = crop.height / CUT_HEIGHT;
  for (let h = 0; h < CUT_WIDTH; h++) {
    for (let w = 0; w < CUT_HEIGHT; w++) {
      let r = 0;
      let g = 0;
      let b = 0;
      const x_start = crop.left + Math.floor(perWidth * w);
      const x_end = Math.floor(crop.left + Math.floor(perWidth * (w + 1)));
      const y_start = crop.top + Math.floor(perHeight * h);
      const y_end = Math.floor(crop.top + Math.floor(perHeight * (h + 1)));
      for (let j = y_start; j <= y_end; j++) {
        for (let i = x_start; i <= x_end; i++) {
          const result = getRGB(bitmap, i, j);
          r += result.r;
          g += result.g;
          b += result.b;
        }
      }
      const totalSize = (x_end - x_start + 1) * (y_end - y_start + 1);
      rgb.push({
        r: r / totalSize,
        g: g / totalSize,
        b: b / totalSize,
      });
    }
  }
  return rgb;
}

function hammingDistance(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  const average1 = average(a);
  const average2 = average(b);
  const a1 = a.map(v => v > average1 ? 1 : 0);
  const b1 = b.map(v => v > average2 ? 1 : 0);
  let distance = 0;
  for (let i = 0; i < length; i++) {
    if (b1[i] !== a1[i]) {
      distance += 1;
    }
  }
  if (length) {
    return distance / length;
  }
  return 1;
}

// 计算两组数据的相似度
export function textureCompare(grayscale: number[], newGrayscale: number[]): number {
  return  (1 - Math.min(hammingDistance(grayscale, newGrayscale), 1)) * 100;
}

export function absoluteCompare(hsv: HSV[], newHSV: HSV[], ignores?: Array<'h' | 's' | 'v'>): number {
  const hasH = !ignores?.includes('h');
  const hasS = !ignores?.includes('s');
  const hasV = !ignores?.includes('v');
  const MAX_DIFF = (hasH ? 50 : 0) + (hasS ? 20 : 0) + (hasV ? 20 : 0);
  const length = Math.min(hsv.length, newHSV.length);
  let totalDiff = 0;
  let total = 0;
  for (let i = 0; i < length; i++) {
    const h1 = hsv[i].h;
    const h2 = newHSV[i].h;
    const s1 = hsv[i].s;
    const s2 = newHSV[i].s;
    const v1 = hsv[i].v;
    const v2 = newHSV[i].v;
    total += MAX_DIFF;
    totalDiff += Math.pow(
      (hasH ? Math.pow(h1 - h2, 2) : 0) + (hasS ? Math.pow(s1 - s2, 2) : 0) + (hasV ? Math.pow(v1 - v2, 2) : 0),
      0.5,
    );
  }
  return (1 - Math.min(totalDiff / total, 1)) * 100;
}

export function absoluteCompareInArea(crop: CropData, bitmap: Bitmap, area: Area, expect: number, ignores: Array<'h' | 's' | 'v'> = []) {
  const maxX = Math.max(area.left + area.width - crop.width, area.left);
  const maxY = Math.max(area.top + area.height - crop.height, area.top);
  let value = 0;
  for (let j = area.top; j <= maxY; j++) {
    for (let i = area.left; i <= maxX; i++) {
      const cut = cutPicture({ left: i, top: j, width: crop.width, height: crop.height }, bitmap);
      const hsv = rgb2hsv(cut);
      value = Math.max(value, absoluteCompare(crop.hsv!, hsv, ignores));
      if (value > expect) {
        return { value, result: true };
      }
    }
  }
  return { value, result: false };
}
