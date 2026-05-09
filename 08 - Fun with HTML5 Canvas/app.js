/* ==========================================================================
    1. DOM ELEMENTS & CONSTANTS
   ========================================================================== */

// Canvas Layers
const canvas = document.querySelector('#draw');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const octx = overlay.getContext('2d');

// Layout Elements
const workspace = document.querySelector('.workspace');
const wrapper = document.querySelector('#canvas-wrapper');

// Toolbar & Sidebar UI
const colorPicker = document.querySelector('#colorPicker');
const recentColorsContainer = document.querySelector('#recentColors');
const lineWidthInput = document.querySelector('#lineWidth');
const sizeValueDisplay = document.querySelector('#sizeValue');
const activeToolDisplay = document.querySelector('#activeTool');
const zoomInput = document.querySelector('#zoomInput');

// Tool Configuration & Default States
const toolSettings = {
    brush: { size: 10 }, highlighter: { size: 30 }, rainbow: { size: 50 },
    fill: { size: 1 }, line: { size: 5 }, rect: { size: 5 },
    circle: { size: 5 }, triangle: { size: 5 }, hexagon: { size: 5 },
    star: { size: 5 }, arrow: { size: 5 }, move: { size: 1 }, eraser: { size: 80 }
};

const toolButtons = {
    brush: document.querySelector('#brushBtn'),
    highlighter: document.querySelector('#highlighterBtn'),
    rainbow: document.querySelector('#rainbowBtn'),
    fill: document.querySelector('#fillBtn'),
    eraser: document.querySelector('#eraserBtn'),
    move: document.querySelector('#moveBtn'),
    line: document.querySelector('#lineBtn'),
    rect: document.querySelector('#rectBtn'),
    circle: document.querySelector('#circleBtn'),
    more: document.querySelector('#moreBtn')
};

/* ==========================================================================
    2. GLOBAL STATE
   ========================================================================== */

let isDrawing = false;
let [startX, startY] = [0, 0];
let [lastX, lastY] = [0, 0];
let hue = 0; // For Rainbow Brush
let currentTool = 'brush';
let zoomLevel = 1.0;
let currentStroke = []; // Captures points for smooth quadratic curves

// History Management
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 30;

// View Controls
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const ZOOM_STEP = 0.1;
let zoomInterval = null;

// Color Persistence
let globalColor = '#000000';
let colorUsage = JSON.parse(localStorage.getItem('prodraw-color-usage')) || {
    '#000000': 10, '#ffffff': 9, '#ff0000': 8, '#4f46e5': 7, '#0000ff': 6
};

// Tool State (Move Tool)
let moveState = 'idle', floatingData = null, floatingW = 0, floatingH = 0;

/* ==========================================================================
    3. CORE UTILITIES
   ========================================================================== */

/**
 * Calculates local canvas coordinates from global mouse/touch events,
 * accounting for current zoom level and canvas positioning.
 */
function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return [(clientX - rect.left) / zoomLevel, (clientY - rect.top) / zoomLevel];
}

/**
 * Returns the top 10 most frequently used colors from local storage.
 */
function getMostUsedColors() {
    return Object.entries(colorUsage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(entry => entry[0]);
}

/* ==========================================================================
    4. CANVAS ENGINE
   ========================================================================== */

/**
 * Initializes the canvas dimensions and sets up the ResizeObserver
 * for the visual resizer handle.
 */
function initCanvas() {
    requestAnimationFrame(() => {
        // Default initial size based on workspace
        const w = workspace.clientWidth || window.innerWidth - 300;
        const h = workspace.clientHeight || window.innerHeight - 100;
        wrapper.style.width = `${Math.floor(w * 0.95)}px`;
        wrapper.style.height = `${Math.floor(h * 0.9)}px`;
        
        updateCanvasSize(true);

        // Watch for manual resizing of the wrapper (bottom-right resizer)
        let resizeTimer;
        new ResizeObserver(() => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => updateCanvasSize(), 100);
        }).observe(wrapper);
        
        // Restore user preferences
        if (localStorage.getItem('prodraw-theme') === 'dark') document.body.classList.add('dark-mode');
        globalColor = getMostUsedColors()[0] || '#000000';
        
        updateThemeUI();
        updateSettingsUI();
        setActiveTool('brush');
    });
}

/**
 * Syncs the internal canvas buffer resolution with the CSS dimensions
 * of the wrapper, preserving the current artwork during the transition.
 */
function updateCanvasSize(isInitial = false) {
    const targetW = wrapper.clientWidth;
    const targetH = wrapper.clientHeight;
    if (targetW === 0 || (canvas.width === targetW && canvas.height === targetH)) return;

    // Snapshot existing work
    let temp = canvas.width > 0 ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
    
    // Resize internal buffers
    canvas.width = overlay.width = targetW;
    canvas.height = overlay.height = targetH;

    // Restore artwork and re-apply drawing context styles
    if (temp) ctx.putImageData(temp, 0, 0);
    applyStyles(ctx);
    applyStyles(octx);
    if (isInitial) saveState();
}

/**
 * Re-applies global line styles (cap, join, width, alpha) to a context.
 */
function applyStyles(c) {
    c.lineCap = c.lineJoin = 'round';
    c.setLineDash([]); 
    c.lineWidth = toolSettings[currentTool].size;
    c.globalAlpha = currentTool === 'highlighter' ? 0.4 : 1.0;
}

/**
 * Pushes the current canvas state to the Undo stack.
 */
function saveState() {
    if (undoStack.length >= MAX_HISTORY) undoStack.shift();
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    redoStack = []; // Redo is invalidated on new action
    updateHistoryUI();
}

/**
 * Enables/Disables undo/redo buttons based on stack availability.
 */
function updateHistoryUI() {
    const undoBtn = document.querySelector('#undoBtn');
    const redoBtn = document.querySelector('#redoBtn');
    if (undoBtn) undoBtn.disabled = undoStack.length <= 1;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

/* ==========================================================================
   5. DRAWING & RENDERING
   ========================================================================== */

/**
 * Draws geometric shapes onto a given context.
 * Used for live previews (overlay) and final commitments (ctx).
 */
function drawShape(c, x, y, isOverlay = false) {
    const dx = x - startX, dy = y - startY, radius = Math.sqrt(dx * dx + dy * dy);
    const isMoveSelection = currentTool === 'move' && isOverlay;

    applyStyles(c);
    c.beginPath();
    
    // Move Tool selection box styling
    if (isMoveSelection) {
        c.setLineDash([5, 5]);
        c.strokeStyle = '#4f46e5';
        c.fillStyle = 'rgba(79, 70, 229, 0.1)';
    } else {
        c.strokeStyle = globalColor;
    }

    switch (currentTool) {
        case 'line': c.moveTo(startX, startY); c.lineTo(x, y); break;
        case 'rect': case 'move': 
            if (isMoveSelection) c.fillRect(startX, startY, dx, dy);
            c.strokeRect(startX, startY, dx, dy); break;
        case 'circle': c.arc(startX, startY, radius, 0, Math.PI * 2); break;
        case 'triangle':
            c.moveTo(startX, startY - radius);
            c.lineTo(startX - radius, startY + radius);
            c.lineTo(startX + radius, startY + radius);
            c.closePath(); break;
        case 'hexagon':
            for(let i=0; i<6; i++) {
                const a = i * Math.PI / 3;
                const px = startX + radius * Math.cos(a), py = startY + radius * Math.sin(a);
                if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
            }
            c.closePath(); break;
        case 'star':
            for(let i=0; i<10; i++) {
                const r = i % 2 ? radius / 2 : radius;
                const a = i * Math.PI / 5 - Math.PI / 2;
                const px = startX + r * Math.cos(a), py = startY + r * Math.sin(a);
                if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
            }
            c.closePath(); break;
        case 'arrow':
            const angle = Math.atan2(dy, dx), head = 15;
            c.moveTo(startX, startY); c.lineTo(x, y);
            c.lineTo(x - head * Math.cos(angle - Math.PI/6), y - head * Math.sin(angle - Math.PI/6));
            c.moveTo(x, y);
            c.lineTo(x - head * Math.cos(angle + Math.PI/6), y - head * Math.sin(angle + Math.PI/6));
            break;
    }
    c.stroke();
}

/**
 * Draws a smooth continuous stroke using Quadratic Bézier curves.
 * Points are processed to find mid-points as control points.
 */
function redrawStroke(c, points) {
    if (points.length < 1) return;
    
    applyStyles(c);
    c.beginPath();
    c.moveTo(points[0].x, points[0].y);

    if (currentTool === 'eraser') {
        c.globalCompositeOperation = 'destination-out';
        c.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        c.globalCompositeOperation = 'source-over';
        c.strokeStyle = (currentTool === 'rainbow') ? `hsl(${hue}, 100%, 50%)` : globalColor;
    }

    if (points.length < 3) {
        points.forEach(p => c.lineTo(p.x, p.y));
    } else {
        // Curve through midpoints for organic smoothness
        for (let i = 1; i < points.length - 1; i++) {
            const midX = (points[i].x + points[i+1].x) / 2;
            const midY = (points[i].y + points[i+1].y) / 2;
            c.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
        }
        c.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    }
    
    c.stroke();
    c.globalCompositeOperation = 'source-over';
}

/**
 * Classic recursive-stack based flood fill algorithm.
 */
function floodFill(x, y, fillColor) {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = img.data;
    const fx = Math.floor(x), fy = Math.floor(y);
    
    // Parse target color
    const targetR = parseInt(fillColor.slice(1, 3), 16);
    const targetG = parseInt(fillColor.slice(3, 5), 16);
    const targetB = parseInt(fillColor.slice(5, 7), 16);
    
    const startPos = (fy * canvas.width + fx) * 4;
    const startR = data[startPos], startG = data[startPos+1], startB = data[startPos+2], startA = data[startPos+3];

    // Avoid infinite loop if clicking same color
    if (startR === targetR && startG === targetG && startB === targetB && startA === 255) return;

    const stack = [[fx, fy]];
    while (stack.length) {
        const [px, py] = stack.pop();
        if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) continue;
        const pos = (py * canvas.width + px) * 4;
        if (data[pos] === startR && data[pos+1] === startG && data[pos+2] === startB && data[pos+3] === startA) {
            data[pos] = targetR; data[pos+1] = targetG; data[pos+2] = targetB; data[pos+3] = 255;
            stack.push([px+1, py], [px-1, py], [px, py+1], [px, py-1]);
        }
    }
    ctx.putImageData(img, 0, 0);
}

/* ==========================================================================
    6. INTERACTION HANDLERS
   ========================================================================== */

function handleDown(e) {
    const [x, y] = getCoords(e);
    octx.clearRect(0, 0, overlay.width, overlay.height);

    // If "dropping" a floating move-tool selection
    if (currentTool === 'move' && moveState === 'floating') {
        ctx.putImageData(floatingData, x - floatingW/2, y - floatingH/2);
        moveState = 'idle'; floatingData = null; saveState(); return;
    }

    if (currentTool === 'fill') { floodFill(x, y, globalColor); saveState(); return; }

    isDrawing = true;
    [startX, startY] = [lastX, lastY] = [x, y];
    currentStroke = [{ x, y }];
    
    if (currentTool === 'move') moveState = 'selecting';
}

function handleMove(e) {
    const [x, y] = getCoords(e);
    octx.clearRect(0, 0, overlay.width, overlay.height);

    // Move tool preview
    if (moveState === 'floating') {
        octx.putImageData(floatingData, x - floatingW/2, y - floatingH/2);
        return;
    }

    if (isDrawing) {
        if (['line', 'rect', 'circle', 'triangle', 'hexagon', 'star', 'arrow', 'move'].includes(currentTool)) {
            drawShape(octx, x, y, true);
        } else if (['brush', 'highlighter', 'rainbow', 'eraser'].includes(currentTool)) {
            currentStroke.push({ x, y });
            if (currentTool === 'rainbow') hue = (hue + 1) % 360;
            redrawStroke(octx, currentStroke);
        }
    } else {
        // PRECISION HOVER PREVIEW
        if (['brush', 'highlighter', 'rainbow', 'eraser'].includes(currentTool)) {
            const size = toolSettings[currentTool].size;
            octx.beginPath();
            octx.arc(x, y, size / 2, 0, Math.PI * 2);
            octx.strokeStyle = 'rgba(0,0,0,0.2)';
            octx.lineWidth = 1;
            octx.stroke();
            
            // Precision inner dot
            octx.beginPath();
            octx.arc(x, y, 1, 0, Math.PI * 2);
            octx.fillStyle = 'rgba(0,0,0,0.4)';
            octx.fill();
        }
    }
}

function handleUp(e) {
    if (!isDrawing) return;
    const [x, y] = getCoords(e);

    // Finalize Move Tool Selection
    if (currentTool === 'move' && moveState === 'selecting') {
        const w = Math.abs(x - startX), h = Math.abs(y - startY);
        if (w > 2 && h > 2) {
            floatingData = ctx.getImageData(Math.min(startX, x), Math.min(startY, y), w, h);
            floatingW = w; floatingH = h;
            ctx.clearRect(Math.min(startX, x), Math.min(startY, y), w, h);
            moveState = 'floating';
            octx.clearRect(0, 0, overlay.width, overlay.height);
        } else moveState = 'idle';
    } 
    // Commit Static Shapes
    else if (['line', 'rect', 'circle', 'triangle', 'hexagon', 'star', 'arrow'].includes(currentTool)) {
        drawShape(ctx, x, y, false);
    } 
    // Commit Freehand Strokes
    else if (['brush', 'highlighter', 'rainbow', 'eraser'].includes(currentTool)) {
        redrawStroke(ctx, currentStroke);
    }

    octx.clearRect(0, 0, overlay.width, overlay.height);
    saveState();
    if (!['eraser', 'move'].includes(currentTool)) trackColorUsage(globalColor);
    isDrawing = false;
    currentStroke = [];
}

/* ==========================================================================
   7. UI & SYSTEM ACTIONS
   ========================================================================== */

/**
 * Updates color frequency history.
 */
function trackColorUsage(color) {
    if (!color || color.length < 7) return;
    const hex = color.toLowerCase();
    colorUsage[hex] = (colorUsage[hex] || 0) + 1;
    localStorage.setItem('prodraw-color-usage', JSON.stringify(colorUsage));
    renderMostUsedColors();
}

/**
 * Renders quick-pick color swatches in the sidebar.
 */
function renderMostUsedColors() {
    if (!recentColorsContainer) return;
    recentColorsContainer.innerHTML = '';
    getMostUsedColors().forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = `color-swatch ${globalColor.toLowerCase() === color ? 'active' : ''}`;
        swatch.style.backgroundColor = color;
        swatch.addEventListener('click', (e) => {
            e.stopPropagation();
            globalColor = color; 
            colorPicker.value = color; 
            updateSettingsUI(); 
        });
        recentColorsContainer.appendChild(swatch);
    });
}

/**
 * Syncs the UI panels with internal states.
 */
function updateSettingsUI() {
    const settings = toolSettings[currentTool];
    if (lineWidthInput) lineWidthInput.value = settings.size;
    if (sizeValueDisplay) sizeValueDisplay.textContent = `${settings.size}px`;
    if (colorPicker) colorPicker.value = globalColor;
    
    const names = { brush: 'Brush', highlighter: 'Marker', rainbow: 'Magic', fill: 'Bucket Fill', move: 'Move Tool', eraser: 'Eraser' };
    if (activeToolDisplay) activeToolDisplay.textContent = names[currentTool] || currentTool.charAt(0).toUpperCase() + currentTool.slice(1);
    renderMostUsedColors();
}

/**
 * Swaps the active tool and updates the workspace cursor.
 */
function setActiveTool(tool) {
    currentTool = tool;
    Object.entries(toolButtons).forEach(([name, btn]) => {
        const isMoreMatch = name === 'more' && ['triangle', 'hexagon', 'star', 'arrow'].includes(tool);
        btn?.classList.toggle('active', name === tool || isMoreMatch);
    });
    
    // Manage custom cursors
    wrapper.className = '';
    const cursors = { brush: 'cursor-brush', highlighter: 'cursor-brush', rainbow: 'cursor-brush', eraser: 'cursor-eraser', move: 'cursor-move', fill: 'cursor-select' };
    wrapper.classList.add(cursors[tool] || 'cursor-shape');

    updateSettingsUI();
}

/**
 * Applies view transformations (zoom).
 */
function applyZoom() {
    zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel));
    wrapper.style.transform = `scale(${zoomLevel})`;
    if (zoomInput) zoomInput.value = `${Math.round(zoomLevel * 100)}%`;
}

/**
 * Dynamically handles continuous zooming on button hold.
 */
function startZooming(dir) {
    stopZooming();
    const tick = () => { zoomLevel += dir; applyZoom(); };
    tick();
    zoomInterval = setInterval(tick, 50);
}

function stopZooming() { clearInterval(zoomInterval); zoomInterval = null; }

/**
 * Theme UI Toggle Update
 * Represents the ACTIVE mode.
 */
function updateThemeUI() {
    const isDark = document.body.classList.contains('dark-mode');
    const icon = document.querySelector('#themeToggle .mode-icon');
    if (icon) icon.textContent = isDark ? '🌙' : '☀️';
}

/* ==========================================================================
   8. EVENT INITIALIZATION
   ========================================================================== */

// --- TOOL SETTINGS ---
colorPicker.addEventListener('input', (e) => { globalColor = e.target.value; renderMostUsedColors(); });
colorPicker.addEventListener('change', (e) => trackColorUsage(e.target.value));
lineWidthInput.addEventListener('input', (e) => { toolSettings[currentTool].size = parseInt(e.target.value); updateSettingsUI(); });

// --- MOUSE & TOUCH INTERACTION ---
wrapper.addEventListener('mousedown', handleDown);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleUp);
wrapper.addEventListener('touchstart', (e) => { if (e.cancelable) e.preventDefault(); handleDown(e); }, { passive: false });
window.addEventListener('touchmove', (e) => { if (e.cancelable) e.preventDefault(); handleMove(e); }, { passive: false });
window.addEventListener('touchend', (e) => handleUp(e));
wrapper.addEventListener('mouseleave', () => octx.clearRect(0, 0, overlay.width, overlay.height));

// --- BUTTON ACTIONS ---
Object.entries(toolButtons).forEach(([name, btn]) => {
    if (!btn) return;
    if (name === 'more') btn.addEventListener('click', () => {
        const b = document.createElement('div'); b.className = 'modal-backdrop';
        b.innerHTML = `<div class="modal"><h3>Extra Shapes</h3><div class="modal-grid">
            <button data-shape="triangle">🔺 Triangle</button><button data-shape="hexagon">⬢ Hexagon</button>
            <button data-shape="star">⭐ Star</button><button data-shape="arrow">➔ Arrow</button>
        </div><button class="modal-close">Close</button></div>`;
        b.addEventListener('click', (e) => {
            const s = e.target.closest('button')?.dataset.shape;
            if (s) setActiveTool(s);
            if (s || e.target.classList.contains('modal-close') || e.target === b) document.body.removeChild(b);
        });
        document.body.appendChild(b);
    });
    else btn.addEventListener('click', () => setActiveTool(name));
});

// --- SYSTEM CONTROLS ---
const ctrl = {
    zoomIn: document.querySelector('#zoomIn'),
    zoomOut: document.querySelector('#zoomOut'),
    zoomReset: document.querySelector('#zoomReset'),
    undo: document.querySelector('#undoBtn'),
    redo: document.querySelector('#redoBtn'),
    clear: document.querySelector('#clearBtn'),
    theme: document.querySelector('#themeToggle'),
    save: document.querySelector('#saveBtn'),
    zoomInput: document.querySelector('#zoomInput')
};

ctrl.zoomIn?.addEventListener('mousedown', () => startZooming(ZOOM_STEP));
ctrl.zoomOut?.addEventListener('mousedown', () => startZooming(-ZOOM_STEP));
window.addEventListener('mouseup', stopZooming);

ctrl.zoomReset?.addEventListener('click', () => { zoomLevel = 1.0; applyZoom(); });

if (ctrl.zoomInput) {
    ctrl.zoomInput.addEventListener('blur', () => {
        const val = parseInt(ctrl.zoomInput.value.replace('%', ''));
        if (!isNaN(val)) zoomLevel = val / 100;
        applyZoom();
    });
    ctrl.zoomInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') ctrl.zoomInput.blur(); });
    ctrl.zoomInput.addEventListener('wheel', (e) => { e.preventDefault(); zoomLevel += (e.deltaY < 0 ? 0.1 : -0.1); applyZoom(); }, { passive: false });
}

ctrl.undo?.addEventListener('click', () => { if (undoStack.length > 1) { redoStack.push(undoStack.pop()); ctx.putImageData(undoStack[undoStack.length-1], 0, 0); updateHistoryUI(); } });
ctrl.redo?.addEventListener('click', () => { if (redoStack.length > 0) { const s = redoStack.pop(); undoStack.push(s); ctx.putImageData(s, 0, 0); updateHistoryUI(); } });
ctrl.clear?.addEventListener('click', () => { if (confirm('Clear All?')) { ctx.clearRect(0, 0, canvas.width, canvas.height); octx.clearRect(0, 0, overlay.width, overlay.height); saveState(); } });
ctrl.theme?.addEventListener('click', () => { document.body.classList.toggle('dark-mode'); localStorage.setItem('prodraw-theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light'); updateThemeUI(); });

ctrl.save?.addEventListener('click', () => {
    const t = document.createElement('canvas'); const tc = t.getContext('2d');
    t.width = canvas.width; t.height = canvas.height;
    tc.fillStyle = '#ffffff'; tc.fillRect(0, 0, t.width, t.height);
    tc.drawImage(canvas, 0, 0);
    const l = document.createElement('a'); l.download = `prodraw-${Date.now()}.png`; l.href = t.toDataURL(); l.click();
});

// --- KICKOFF ---
initCanvas();
