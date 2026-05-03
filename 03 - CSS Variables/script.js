const inputs = document.querySelectorAll('.controls input[type="range"], .controls input[type="color"]');
const imageUpload = document.getElementById('image-upload');
const downloadBtn = document.getElementById('download-btn');
const image = document.getElementById('preview-image');

let currentImageUrl = image.src;

function handleUpdate() {
    const suffix = this.dataset.sizing || '';
    document.documentElement.style.setProperty(`--${this.name}`, this.value + suffix);

    const valueElement = document.getElementById(`${this.id}-value`);
    if (valueElement) valueElement.textContent = this.value + suffix;
}

function applyInitialValues() {
    inputs.forEach(input => handleUpdate.call(input));
}

function handleImageUpload(event) {
    const [file] = event.target.files;
    if (!file) return;

    if (currentImageUrl && currentImageUrl.startsWith('blob:')) URL.revokeObjectURL(currentImageUrl);

    currentImageUrl = URL.createObjectURL(file);
    image.src = currentImageUrl;
}

function getFilterString() {
    const computed = getComputedStyle(document.documentElement);
    const blur = computed.getPropertyValue('--blur');
    const brightness = computed.getPropertyValue('--brightness');
    const contrast = computed.getPropertyValue('--contrast');
    const saturate = computed.getPropertyValue('--saturate');
    const invert = computed.getPropertyValue('--invert');
    const grayscale = computed.getPropertyValue('--grayscale');

    return `blur(${blur}) brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) invert(${invert}) grayscale(${grayscale})`;
}

function downloadEditedImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const computed = getComputedStyle(document.documentElement);
    const border = parseInt(computed.getPropertyValue('--border'), 10) || 0;
    const baseColor = computed.getPropertyValue('--base').trim();

    canvas.width = image.naturalWidth + border * 2;
    canvas.height = image.naturalHeight + border * 2;

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.filter = getFilterString();
    ctx.drawImage(image, border, border, image.naturalWidth, image.naturalHeight);

    const link = document.createElement('a');
    link.download = 'edited-image.png';

    try {
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        alert('This image cannot be downloaded from the current remote source. Upload a local image first, then download again.');
    }
}

const events = ['input', 'change'];
inputs.forEach(input => events.forEach(ev => input.addEventListener(ev, handleUpdate)));
imageUpload.addEventListener('change', handleImageUpload);
downloadBtn.addEventListener('click', downloadEditedImage);

image.addEventListener('load', () => {
    downloadBtn.disabled = !image.naturalWidth;
});

applyInitialValues();
