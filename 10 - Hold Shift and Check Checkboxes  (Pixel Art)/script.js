/**
 * Pixel Studio - Core Logic
 * Handles grid generation, drawing tools, undo/redo, zoom, and exports.
 */

// --- DOM Element Selectors ---
const grid = document.getElementById('grid');
const canvasContainer = document.getElementById('canvasContainer');
const colorPicker = document.getElementById('colorPicker');
const swatchesContainer = document.getElementById('swatches');
const brushBtn = document.getElementById('brushBtn');
const eraseBtn = document.getElementById('eraseBtn');
const clearBtn = document.getElementById('clearBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const gridSizeSelect = document.getElementById('gridSizeSelect');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomLevelText = document.getElementById('zoomLevel');
const exportBtn = document.getElementById('exportBtn');
const themeToggle = document.getElementById('themeToggle');
const brushSizeSlider = document.getElementById('brushSizeSlider');
const brushSizeDisplay = document.getElementById('brushSizeDisplay');

// --- State Variables ---
let GRID_SIZE = parseInt(gridSizeSelect.value);
const DEFAULT_SWATCHES = ['#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

let isDrawing = false;
let lastPixelClicked = null;
let currentMode = 'brush'; 
let zoomLevel = 1;
let brushSize = 1;
let hoveredIndices = [];
let lastCustomColor = null;

// History Management
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 50;

/**
 * Entry point: Initializes the application
 */
function init() {
  createGrid();
  initSwatches();
  setupEventListeners();
  updateToolUI();
  loadTheme();
}

/**
 * Returns current colors of all pixels
 */
const getGridState = () => Array.from(grid.children).map(p => p.style.backgroundColor || 'transparent');

/**
 * Applies a saved state to the grid
 */
const applyGridState = (state) => state.forEach((color, i) => grid.children[i].style.backgroundColor = color);

/**
 * Generates the drawing grid based on current GRID_SIZE
 */
function createGrid() {
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;
  
  const pixelSize = 600 / GRID_SIZE;
  document.documentElement.style.setProperty('--pixel-size', `${pixelSize}px`);

  const fragment = document.createDocumentFragment();
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const pixel = document.createElement('div');
    pixel.className = 'pixel';
    pixel.dataset.index = i;
    pixel.addEventListener('mousedown', (e) => handlePixelAction(e, i));
    pixel.addEventListener('mouseenter', () => handlePixelHover(i));
    fragment.appendChild(pixel);
  }
  grid.appendChild(fragment);
  
  undoStack = [];
  redoStack = [];
  updateHistoryButtons();
}

/**
 * Initializes the quick color palette
 */
function initSwatches() {
  swatchesContainer.innerHTML = '';
  DEFAULT_SWATCHES.forEach((color, index) => {
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    
    // Make the last swatch the custom color picker
    if (index === DEFAULT_SWATCHES.length - 1) {
      swatch.id = 'customSwatch';
      swatch.classList.add('picker-swatch', 'flex-center');
      swatch.title = 'Pick Custom Color';
      swatch.addEventListener('click', () => {
        const currentHex = colorPicker.value.toLowerCase();
        // If we have a custom color and aren't using it, select it. Otherwise, open picker.
        if (lastCustomColor && (currentHex !== lastCustomColor || currentMode !== 'brush')) {
          colorPicker.value = lastCustomColor;
          currentMode = 'brush';
          updateToolUI();
        } else {
          colorPicker.click();
        }
      });
    } else {
      swatch.style.backgroundColor = color;
      swatch.dataset.color = color;
      swatch.addEventListener('click', () => {
        colorPicker.value = color;
        currentMode = 'brush';
        updateToolUI();
      });
    }
    swatchesContainer.appendChild(swatch);
  });
}

/**
 * Attaches all global and element-specific event listeners
 */
function setupEventListeners() {
  const setMode = (mode) => () => { currentMode = mode; updateToolUI(); };
  
  colorPicker.addEventListener('input', () => {
    currentMode = 'brush';
    updateToolUI();
  });
  brushBtn.addEventListener('click', setMode('brush'));
  eraseBtn.addEventListener('click', setMode('eraser'));
  
  brushSizeSlider.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value);
    brushSizeDisplay.innerText = `${brushSize}px`;
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('Clear the entire canvas?')) {
      saveState();
      Array.from(grid.children).forEach(p => p.style.backgroundColor = 'transparent');
    }
  });

  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);

  gridSizeSelect.addEventListener('change', (e) => {
    if (confirm('Changing grid size will clear your current work. Continue?')) {
      GRID_SIZE = parseInt(e.target.value);
      createGrid();
    } else {
      gridSizeSelect.value = GRID_SIZE;
    }
  });

  zoomInBtn.addEventListener('click', () => updateZoom(0.1));
  zoomOutBtn.addEventListener('click', () => updateZoom(-0.1));
  exportBtn.addEventListener('click', exportToPNG);
  themeToggle.addEventListener('click', toggleTheme);

  window.addEventListener('mouseup', () => isDrawing = false);
  
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') { e.preventDefault(); undo(); }
      if (e.key === 'y') { e.preventDefault(); redo(); }
    }
  });
}

// --- Drawing Logic ---

function handlePixelAction(e, index) {
  saveState();
  isDrawing = true;
  if (e.shiftKey && lastPixelClicked !== null) {
    fillRange(lastPixelClicked, index);
  } else {
    paintBrush(index);
  }
  lastPixelClicked = index;
}

function handlePixelHover(index) {
  updateHoverVisual(index);
  if (isDrawing) paintBrush(index);
}

function updateHoverVisual(centerIndex) {
  hoveredIndices.forEach(idx => grid.children[idx]?.classList.remove('brush-hover'));
  hoveredIndices = getBrushIndices(centerIndex);
  hoveredIndices.forEach(idx => grid.children[idx]?.classList.add('brush-hover'));
}

function getBrushIndices(centerIndex) {
  const indices = [];
  const centerX = centerIndex % GRID_SIZE;
  const centerY = Math.floor(centerIndex / GRID_SIZE);
  const offset = Math.floor(brushSize / 2);

  for (let dy = 0; dy < brushSize; dy++) {
    for (let dx = 0; dx < brushSize; dx++) {
      const x = centerX + dx - offset;
      const y = centerY + dy - offset;
      if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        indices.push(y * GRID_SIZE + x);
      }
    }
  }
  return indices;
}

function paintBrush(centerIndex) {
  getBrushIndices(centerIndex).forEach(idx => paintPixel(grid.children[idx]));
}

function paintPixel(pixel) {
  if (pixel) pixel.style.backgroundColor = currentMode === 'brush' ? colorPicker.value : 'transparent';
}

function fillRange(start, end) {
  const startX = start % GRID_SIZE;
  const startY = Math.floor(start / GRID_SIZE);
  const endX = end % GRID_SIZE;
  const endY = Math.floor(end / GRID_SIZE);
  const offset = Math.floor(brushSize / 2);

  const minX = Math.min(startX, endX) - offset;
  const maxX = Math.max(startX, endX) - offset + brushSize - 1;
  const minY = Math.min(startY, endY) - offset;
  const maxY = Math.max(startY, endY) - offset + brushSize - 1;

  for (let y = minY; y <= maxY; y++) {
    if (y < 0 || y >= GRID_SIZE) continue;
    const rowOffset = y * GRID_SIZE;
    for (let x = minX; x <= maxX; x++) {
      if (x >= 0 && x < GRID_SIZE) paintPixel(grid.children[rowOffset + x]);
    }
  }
}

// --- History Management ---

function saveState() {
  undoStack.push(getGridState());
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
}

function handleHistory(fromStack, toStack) {
  if (fromStack.length === 0) return;
  toStack.push(getGridState());
  applyGridState(fromStack.pop());
  updateHistoryButtons();
}

const undo = () => handleHistory(undoStack, redoStack);
const redo = () => handleHistory(redoStack, undoStack);

function updateHistoryButtons() {
  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

// --- UI & View Updates ---

function updateToolUI() {
  brushBtn.classList.toggle('active', currentMode === 'brush');
  eraseBtn.classList.toggle('active', currentMode === 'eraser');
  
  const currentHex = colorPicker.value.toLowerCase();
  let isPreset = false;

  document.querySelectorAll('.swatch').forEach(sw => {
    const isThisActive = currentMode === 'brush' && sw.dataset.color?.toLowerCase() === currentHex;
    if (isThisActive) isPreset = true;
    sw.classList.toggle('active', isThisActive);
  });

  // If the color isn't a preset, highlight and color the custom swatch
  const customSwatch = document.getElementById('customSwatch');
  if (customSwatch) {
    if (!isPreset && currentMode === 'brush') {
      lastCustomColor = currentHex;
    }

    const isCustomActive = currentMode === 'brush' && lastCustomColor && currentHex === lastCustomColor;
    customSwatch.classList.toggle('active', isCustomActive);

    if (lastCustomColor) {
      customSwatch.style.backgroundColor = lastCustomColor;
      customSwatch.style.backgroundImage = 'none';
      customSwatch.innerHTML = '';
    } else {
      customSwatch.style.backgroundColor = '';
      customSwatch.style.backgroundImage = '';
      customSwatch.innerHTML = '';
    }
    }
    }
function updateZoom(delta) {
  zoomLevel = Math.max(0.5, Math.min(3, zoomLevel + delta));
  canvasContainer.style.transform = `scale(${zoomLevel})`;
  zoomLevelText.innerText = `${Math.round(zoomLevel * 100)}%`;
}

// --- Theme Management ---

function toggleTheme() {
  const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function loadTheme() {
  document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');
}

// --- Exports ---

function exportToPNG() {
  const SCALE = 20;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = GRID_SIZE * SCALE;
  const ctx = canvas.getContext('2d');
  
  getGridState().forEach((color, i) => {
    if (color !== 'transparent') {
      ctx.fillStyle = color;
      ctx.fillRect((i % GRID_SIZE) * SCALE, Math.floor(i / GRID_SIZE) * SCALE, SCALE, SCALE);
    }
  });
  
  const link = document.createElement('a');
  link.download = `pixel-art-${canvas.width}x${canvas.height}.png`;
  link.href = canvas.toDataURL();
  link.click();
}

init();
