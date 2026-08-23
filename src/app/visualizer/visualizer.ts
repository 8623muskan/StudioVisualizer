import { Component, OnInit, HostListener, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export type WallKey = 'left' | 'right' | 'front' | 'winLeft' | 'winTop' | 'winRight';
export interface WallItem { key: WallKey; label: string; hint: string; }

@Component({
  selector: 'app-visualizer',
  standalone: true,
  imports: [CommonModule],
  template: `
<style>
  * { box-sizing: border-box; }
  .vis-wrapper { display: flex; flex-direction: column; height: 100vh; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; overflow: hidden; }
  
  .vis-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; background: #ffffff; border-bottom: 1px solid #e2e8f0; z-index: 10; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .vis-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b; letter-spacing: -0.025em; }
  
  .top-actions { display: flex; gap: 10px; align-items: center; }

  .btn-outline { background: #ffffff; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; color: #475569; display: flex; align-items: center; gap: 6px; font-size: 0.875rem; transition: all 0.2s; }
  .btn-outline:hover { background: #f1f5f9; color: #0f172a; border-color: #94a3b8; }

  .btn-solid { background: #2563eb; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; color: #ffffff; display: inline-flex; align-items: center; gap: 6px; font-size: 0.875rem; transition: background 0.2s; }
  .btn-solid:hover { background: #1d4ed8; }

  .btn-success { background: #059669; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; color: #ffffff; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 0.875rem; width: 100%; transition: background 0.2s; }
  .btn-success:hover { background: #047857; }
  .btn-success:disabled { background: #9ca3af; cursor: not-allowed; }

  .btn-danger { background: #dc2626; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; color: #ffffff; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 0.875rem; transition: background 0.2s; }
  .btn-danger:hover { background: #b91c1c; }
  .btn-danger:disabled { background: #fca5a5; cursor: not-allowed; }
  
  .vis-main { display: flex; flex: 1; overflow: hidden; padding: 24px; gap: 24px; }
  
  .canvas-section { flex: 1; background: #ffffff; border-radius: 16px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid #e2e8f0; padding: 24px; position: relative; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .canvas-inner { position: relative; max-width: 100%; max-height: 80vh; display: inline-flex; border-radius: 10px; overflow: hidden; cursor: crosshair !important; }
  .room-image { display: block; width: 100%; height: auto; max-height: 80vh; object-fit: contain; border-radius: 10px; cursor: crosshair !important; }
  
  .svg-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5; }
  .wall-polygon { pointer-events: auto; cursor: crosshair !important; mix-blend-mode: multiply; }
  
  .control-sidebar { width: 410px; background: #ffffff; border-radius: 16px; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .panel-block h3 { margin: 0 0 8px 0; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  
  /* Hexagonal Palette Styling */
  .hex-palette-container { display: flex; flex-direction: column; align-items: center; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; gap: 4px; overflow-x: auto; }
  .hex-row { display: flex; gap: 3px; justify-content: center; }
  .hex-item { width: 22px; height: 25px; background-color: var(--hex-color); clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); cursor: pointer; transition: transform 0.15s, filter 0.15s; position: relative; }
  .hex-item:hover { transform: scale(1.25); z-index: 10; filter: brightness(1.15); }
  .hex-item.active { transform: scale(1.3); z-index: 15; filter: drop-shadow(0 0 2px #0f172a); outline: 2px solid #fff; }

  .wall-btn-group { display: flex; flex-direction: column; gap: 6px; }
  .wall-select-btn { padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 600; color: #475569; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; }
  .wall-select-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
  .wall-select-btn.active { background: #eff6ff; border-color: #3b82f6; color: #1d4ed8; box-shadow: 0 0 0 1px #3b82f6; }
  .wall-hint { font-size: 0.7rem; color: #94a3b8; }
  
  input[type="range"] { width: 100%; height: 6px; background: #e2e8f0; border-radius: 4px; outline: none; margin: 8px 0; accent-color: #2563eb; }
  .upload-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center; color: #64748b; }
  
  .dot-marker { position: absolute; width: 10px; height: 10px; background: #2563eb; border: 2px solid #fff; border-radius: 50%; transform: translate(-50%, -50%); z-index: 20; pointer-events: none; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
  .measurement-tools { display: flex; flex-direction: column; gap: 8px; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 4px; }
  
  .status-toast { position: fixed; bottom: 24px; right: 24px; background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 0.875rem; z-index: 1000; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); animation: fadeInOut 3s ease; }
  @keyframes fadeInOut { 0% { opacity: 0; transform: translateY(10px); } 15% { opacity: 1; transform: translateY(0); } 85% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(10px); } }
</style>

<div class="vis-wrapper">
  <header class="vis-header">
    <button class="btn-outline" (click)="goBack()">&#8592; Back</button>
    <h2>Studio Visualizer</h2>
    <div class="top-actions">
      <label class="btn-solid" style="cursor: pointer;">
        📁 Upload Image
        <input type="file" (change)="uploadImage($event)" accept="image/*" style="display: none;" />
      </label>
      <button class="btn-outline" (click)="saveDesign()">💾 Save Design</button>
      <button class="btn-danger" style="width: auto;" (click)="clearAllPaint()">🗑️ Reset All</button>
    </div>
  </header>

  <div *ngIf="toastMessage" class="status-toast">{{ toastMessage }}</div>

  <main class="vis-main">
    <section class="canvas-section">
      <div *ngIf="!imageUrl" class="upload-placeholder">
        <p style="font-weight: 600; font-size: 1.1rem; margin: 0; color: #334155;">No room image loaded</p>
        <p style="font-size: 0.875rem; color: #64748b; margin: 0;">Click "Upload Image" in the top right to begin.</p>
      </div>

      <div class="canvas-inner" *ngIf="imageUrl" (click)="onCanvasClick($event)">
        <img [src]="imageUrl" alt="Room Canvas" class="room-image" />

        <div *ngFor="let pt of getCurrentPoints()" class="dot-marker" [style.left.px]="pt.displayX" [style.top.px]="pt.displayY"></div>

        <svg class="svg-overlay" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path *ngFor="let key of wallKeys" 
                [attr.d]="customWalls[key]" 
                [attr.fill]="selectedColor" 
                [attr.fill-opacity]="paintOpacity" 
                class="wall-polygon" />
        </svg>
      </div>
    </section>

    <aside class="control-sidebar">
      <div class="panel-block">
        <h3>1. Select Section to Measure</h3>
        <div class="wall-btn-group">
          <button *ngFor="let w of wallItems" class="wall-select-btn" [class.active]="activeWallKey === w.key" (click)="setActiveWall(w.key)">
            <div>
              <div style="font-weight: 600; font-size: 0.85rem;">{{ w.label }}</div>
              <div class="wall-hint">{{ w.hint }}</div>
            </div>
            <span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: 600;" [style.background]="customWalls[w.key] ? '#d1fae5' : '#f1f5f9'" [style.color]="customWalls[w.key] ? '#065f46' : '#64748b'">
              {{ customWalls[w.key] ? 'Saved ✓' : 'Draw' }}
            </span>
          </button>
        </div>
      </div>

      <div class="panel-block">
        <h3>2. Measurement Controls</h3>
        <div class="measurement-tools">
          <span style="font-weight: 600; font-size: 0.85rem; color: #334155; text-align: center;">
            📍 Active: {{ getActiveWallLabel() }} ({{ getCurrentPoints().length }} pts)
          </span>
          <div style="font-size: 0.75rem; color: #64748b; text-align: center;">Click corners on image. Use <b>Ctrl+Z</b> to undo.</div>
          <div style="display: flex; gap: 6px; margin-top: 4px;">
            <button class="btn-outline" style="flex: 1; justify-content: center; padding: 6px;" (click)="undoLastPoint()" [disabled]="getCurrentPoints().length === 0">↩️ Undo</button>
            <button class="btn-danger" style="flex: 1; padding: 6px; font-size: 0.8rem;" (click)="clearCurrentPoints()" [disabled]="getCurrentPoints().length === 0 && !customWalls[activeWallKey]">🗑️ Clear Current</button>
          </div>
          <button class="btn-success" style="padding: 8px; margin-top: 4px;" (click)="finishCurrentWall()" [disabled]="getCurrentPoints().length < 3">✅ Save Section</button>
        </div>
      </div>

      <!-- Hexagonal Color Palette Picker -->
      <div class="panel-block">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="margin: 0;">3. Hex Color Palette</h3>
          <span style="font-size: 0.75rem; color: #2563eb; font-weight: 600;">{{ selectedColor }}</span>
        </div>
        <div class="hex-palette-container">
          <div class="hex-row" *ngFor="let row of hexPaletteRows">
            <div *ngFor="let hex of row" 
                 class="hex-item" 
                 [style.--hex-color]="hex" 
                 [class.active]="selectedColor.toUpperCase() === hex.toUpperCase()"
                 (click)="selectColor(hex)" 
                 [title]="hex">
            </div>
          </div>
        </div>
      </div>

      <div class="panel-block">
        <h3>4. Paint Opacity</h3>
        <input type="range" min="0.1" max="1.0" step="0.05" [value]="paintOpacity" (input)="updateOpacity($event)" />
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; font-weight: 600;">
          <span>Subtle</span>
          <span style="color: #2563eb;">{{ Math.round(paintOpacity * 100) }}%</span>
          <span>Strong</span>
        </div>
      </div>
    </aside>
  </main>
</div>
  `
})
export class VisualizerComponent implements OnInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  imageUrl: string | null = null;
  paintOpacity: number = 0.65;
  selectedColor: string = '#7B68EE';
  toastMessage: string = '';
  Math = Math;

  hexPaletteRows: string[][] = [
    ['#1A365D', '#2B6CB0', '#3182CE', '#4299E1', '#63B3ED', '#90CDF4'],
    ['#004d40', '#00695c', '#00796b', '#00897b', '#26a69a', '#4db6ac', '#80cbc4'],
    ['#1b5e20', '#2e7d32', '#388e3c', '#43a047', '#4caf50', '#66bb6a', '#81c784', '#a5d6a7'],
    ['#33691e', '#558b2f', '#689f38', '#7cb342', '#8bc34a', '#9ccc65', '#aed581'],
    ['#f57f17', '#fbc02d', '#fdd835', '#ffee58', '#fff59d', '#fff9c4', '#fffffk'],
    ['#e65100', '#ef6c00', '#f57c00', '#fb8c00', '#ffa726', '#ffb74d', '#ffe0b2'],
    ['#b71c1c', '#c62828', '#d32f2f', '#e53935', '#f44336', '#ef5350', '#e57373'],
    ['#4a148c', '#6a1b9a', '#7b1fa2', '#8e24aa', '#9c27b0', '#ab47bc', '#ba68c8']
  ];

  wallItems: WallItem[] = [
    { key: 'left', label: '1. Left Side Wall', hint: 'Left wall panel' },
    { key: 'winLeft', label: '2. Window: Left Strip', hint: 'Solid section left of glass' },
    { key: 'winTop', label: '3. Window: Upper Strip', hint: 'Section above glass' },
    { key: 'winRight', label: '4. Window: Right Strip', hint: 'Solid section right of glass' },
    { key: 'right', label: '5. Right Side Wall', hint: 'Right wall panel' },
    { key: 'front', label: '6. Front / Base Wall', hint: 'Foreground edge' }
  ];

  wallKeys: WallKey[] = ['left', 'winLeft', 'winTop', 'winRight', 'right', 'front'];
  activeWallKey: WallKey = 'left';
  
  wallPoints: Record<WallKey, { x: number, y: number, displayX: number, displayY: number }[]> = { 
    left: [], right: [], front: [], winLeft: [], winTop: [], winRight: [] 
  };
  customWalls: Record<WallKey, string> = { 
    left: '', right: '', front: '', winLeft: '', winTop: '', winRight: '' 
  };

  ngOnInit(): void {
    this.loadFromLocalStorage();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      this.undoLastPoint();
    }
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.cdr.detectChanges();
    setTimeout(() => {
      if (this.toastMessage === msg) {
        this.toastMessage = '';
        this.cdr.detectChanges();
      }
    }, 3000);
  }

  saveToLocalStorage(): void {
    try {
      const sessionData = {
        imageUrl: this.imageUrl,
        customWalls: this.customWalls,
        selectedColor: this.selectedColor,
        paintOpacity: this.paintOpacity
      };
      localStorage.setItem('rimura_visualizer_session', JSON.stringify(sessionData));
    } catch (e) {
      console.error('Storage limit reached or error saving session', e);
    }
  }

  loadFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem('rimura_visualizer_session');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.imageUrl) this.imageUrl = data.imageUrl;
        if (data.customWalls) this.customWalls = data.customWalls;
        if (data.selectedColor) this.selectedColor = data.selectedColor;
        if (data.paintOpacity !== undefined) this.paintOpacity = data.paintOpacity;
        this.showToast('Restored previous session successfully');
      }
    } catch (e) {
      console.error('Error loading saved session', e);
    }
  }

  uploadImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file: File = input.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imageUrl = e.target.result;
      this.clearAllPaint();
      this.saveToLocalStorage();
      this.showToast('Room image uploaded successfully');
    };
    reader.readAsDataURL(file);
  }

  setActiveWall(key: WallKey): void {
    this.activeWallKey = key;
  }

  getActiveWallLabel(): string {
    const found = this.wallItems.find(w => w.key === this.activeWallKey);
    return found ? found.label : 'Section';
  }

  getCurrentPoints() {
    return this.wallPoints[this.activeWallKey];
  }

  onCanvasClick(event: MouseEvent): void {
    if (!this.imageUrl) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    const displayX = event.clientX - rect.left;
    const displayY = event.clientY - rect.top;
    
    const x = Math.round((displayX / rect.width) * 1000);
    const y = Math.round((displayY / rect.height) * 1000);

    this.wallPoints[this.activeWallKey].push({ x, y, displayX, displayY });
    this.cdr.detectChanges();
  }

  undoLastPoint(): void {
    const pts = this.getCurrentPoints();
    if (pts.length > 0) {
      pts.pop();
      this.cdr.detectChanges();
    }
  }

  clearCurrentPoints(): void {
    this.wallPoints[this.activeWallKey] = [];
    this.customWalls[this.activeWallKey] = '';
    this.saveToLocalStorage();
    this.showToast(`Cleared ${this.getActiveWallLabel()}`);
    this.cdr.detectChanges();
  }

  finishCurrentWall(): void {
    const pts = this.getCurrentPoints();
    if (pts.length < 3) return;

    const path = pts.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, '') + ' Z';

    this.customWalls[this.activeWallKey] = path;
    this.wallPoints[this.activeWallKey] = [];
    this.saveToLocalStorage();
    this.showToast(`${this.getActiveWallLabel()} saved successfully`);
    this.cdr.detectChanges();
  }

  clearAllPaint(): void {
    this.customWalls = { left: '', right: '', front: '', winLeft: '', winTop: '', winRight: '' };
    this.wallPoints = { left: [], right: [], front: [], winLeft: [], winTop: [], winRight: [] };
    this.saveToLocalStorage();
    this.showToast('Reset all paint and measurements');
    this.cdr.detectChanges();
  }

  saveDesign(): void {
    if (!this.imageUrl) {
      this.showToast('Please upload an image first!');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.imageUrl;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1000, 1000);

      ctx.globalAlpha = this.paintOpacity;
      ctx.fillStyle = this.selectedColor;
      
      this.wallKeys.forEach(key => {
        const pathStr = this.customWalls[key];
        if (pathStr) {
          const p = new Path2D(pathStr);
          ctx.fill(p);
        }
      });

      const link = document.createElement('a');
      link.download = 'rimura-painted-room.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      this.showToast('Design saved & downloaded successfully!');
    };
  }

  selectColor(hex: string): void {
    if (hex && hex !== '#fffffk') {
      this.selectedColor = hex;
      this.saveToLocalStorage();
    }
  }

  updateOpacity(event: Event): void {
    this.paintOpacity = parseFloat((event.target as HTMLInputElement).value);
    this.saveToLocalStorage();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}