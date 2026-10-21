// 图集加载与槽位索引。图集文件由 素材/图集.png + 图集.json 原样拷贝而来；
// 黑白图集 素材/图集黑白.png 与彩色图集同尺寸、同槽位，共用一份槽位表。

import { ACHIEVABLE, HYPER_ACHIEVABLE, type GameMode } from '../game/constants';

type MineSpriteFamily = 'flag' | 'mine' | 'boom' | 'wrong' | 'right' | 'rightflag' | 'wrongflag';

/** 实雷共用贴图；双曲模式的单位雷使用 ±j 专用贴图。 */
export function mineSpriteName(family: MineSpriteFamily, t: number, mode: GameMode = 'complex'): string {
  return `${mode === 'hyper' && t >= 3 ? 'h' : ''}${family}_${t}`;
}

/** 双曲模式共享 12 张正数贴图，负值显示为根式加 i（不是 j）。 */
export function numberSpriteName(D: number, mode: GameMode = 'complex'): string {
  if (mode === 'complex') return ACHIEVABLE.includes(D) ? `num_${D}` : 'blank';
  if (!HYPER_ACHIEVABLE.includes(D)) return 'blank';
  if (D < 0) return `hnum_${-D}_i`;
  return ACHIEVABLE.includes(D) ? `num_${D}` : `hnum_${D}`;
}

export interface Slot {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export class Atlas {
  image!: HTMLImageElement;
  /** 黑白图集；缺失或尺寸不符时为 null，关掉颜色后仍画彩色（与上游一致）。 */
  monoImage: HTMLImageElement | null = null;
  slots = new Map<string, Slot>();
  /** D 值 → num 贴图槽位（num_by_D 的 TS 版） */
  numByD = new Map<number, Slot>();
  /** 有符号 D 值 → 双曲数字贴图槽位。 */
  hyperNumByD = new Map<number, Slot>();

  async load(imageUrl: string, jsonUrl: string, monoUrl?: string): Promise<void> {
    const [img, meta, mono] = await Promise.all([
      loadImage(imageUrl),
      fetch(jsonUrl).then((r) => {
        if (!r.ok) throw new Error(`加载图集元数据失败: ${r.status}`);
        return r.json() as Promise<{ width: number; height: number; slots: Slot[] }>;
      }),
      // 黑白图集可选：加载失败不影响开局。
      monoUrl ? loadImage(monoUrl).catch(() => null) : null,
    ]);
    this.image = img;
    this.monoImage = mono && mono.naturalWidth === meta.width && mono.naturalHeight === meta.height ? mono : null;
    this.slots.clear();
    this.numByD.clear();
    this.hyperNumByD.clear();
    for (const s of meta.slots) {
      this.slots.set(s.name, s);
      const m = /^num_(\d+)$/.exec(s.name);
      if (m) this.numByD.set(Number(m[1]), s);
    }
    for (const D of HYPER_ACHIEVABLE) {
      this.hyperNumByD.set(D, this.slot(numberSpriteName(D, 'hyper')));
    }
  }

  slot(name: string): Slot {
    const s = this.slots.get(name);
    if (!s) throw new Error(`图集缺槽位: ${name}`);
    return s;
  }

  /** 当前该用哪份图集：关掉颜色用黑白那份，没加载成功就退回彩色（对应上游 activeAtlas）。 */
  sheet(mono: boolean): HTMLImageElement {
    return mono && this.monoImage ? this.monoImage : this.image;
  }

  flagSprite(t: number, mode: GameMode = 'complex'): Slot {
    return this.slot(mineSpriteName('flag', t, mode));
  }
  mineSprite(t: number, mode: GameMode = 'complex'): Slot {
    return this.slot(mineSpriteName('mine', t, mode));
  }
  boomSprite(t: number, mode: GameMode = 'complex'): Slot {
    return this.slot(mineSpriteName('boom', t, mode));
  }
  wrongSprite(t: number, mode: GameMode = 'complex'): Slot {
    return this.slot(mineSpriteName('wrong', t, mode));
  }
  rightSprite(t: number, mode: GameMode = 'complex'): Slot {
    return this.slot(mineSpriteName('right', t, mode));
  }
  rightFlagSprite(t: number, mode: GameMode = 'complex'): Slot {
    return this.slot(mineSpriteName('rightflag', t, mode));
  }
  wrongFlagSprite(t: number, mode: GameMode = 'complex'): Slot {
    return this.slot(mineSpriteName('wrongflag', t, mode));
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`加载图集图像失败: ${url}`));
    img.src = url;
  });
}
