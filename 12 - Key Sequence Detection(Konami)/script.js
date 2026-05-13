// Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A
const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

// State
let memeModeActive = false;
let konamiIndex = 0;
let soundEnabled = true;
let memeInterval, emojiInterval, quoteInterval;

// Assets
const MEME_IMAGES = [
    'https://i.imgflip.com/4t0m5.jpg',  // Success Kid Static
    'https://i.imgflip.com/1otk96.jpg', // Roll Safe (Smart Guy)
    'https://i.imgflip.com/26am.jpg',   // Doge
    'https://i.imgflip.com/43a45p.png', // Cheems
    'https://i.imgflip.com/9ehk.jpg',   // Bad Luck Brian
    'https://i.imgflip.com/1bij.jpg',   // One does not simply
    'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzMwMGV3aHR0dzNjejF2ejdpeXl1bnIxNXFua3M5eHVwdHB3MDR4ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1EeZzAJfMhQCA/giphy.gif',
    'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzMwMGV3aHR0dzNjejF2ejdpeXl1bnIxNXFua3M5eHVwdHB3MDR4ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1EeZzAJfMhQCA/giphy.gif',
    'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWpyMzRrZ2k4NHU4cWNkbzd2aGFqazVxNHVsMWtxZ3Z6NThmYXJnOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/aIU9nrI16xVIfbDLGL/giphy.gif',
    'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjdiYm5jMWxrc2prcjgyaTBsOWNnb2ljemJoYnJ2aTEydnB1OGFzNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/oIp5cYStQKipZVCtgq/giphy.gif',
    'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnFuYTkxNzR6YjIycXE0b3MycjZ5a3lvcXF0eTlzejZqNmc2cHdudiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/nQhvy82NhjLnvOERdv/giphy.gif',
    'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExenZreGJvbHh5bXRoemg0b2xwNzNuZ3Jma3Y4a2txZ2pzaDJvZDc2aSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dP0M43Jz8HSLOlV64v/giphy.gif',
    'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZmZvMG0wejNidmo4MWg1MzBtcHFyZGZuNzRqMzlqYnZneXJubWtnZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/CnkPo7eYfF1wCFUF5W/giphy.gif',
    'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjV2ZHUwM3dsamFuNGhhbWg1c2ZpeHA1eDlyrzVybnE4eGNwcnd3MiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JVz9KkOaJi40GC1qLH/giphy.gif',
    'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjRsNnRqZTh5YXBxdTE3YjFuYnZqeWhpc3R6cGJmYXh0dGNxbm13bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/SGiMgPtK4N31S9gsLN/giphy.gif'
];

const EMOJIS = ['😂', '🔥', '💀', '🚀', '✨', '🤡', '🌈', '🍕', '🎉', '🇮🇳', '🪔', '🍛'];

const QUOTES = [
    "SUCH WOW!",
    "MUCH MEME!",
    "TO THE MOON! 🚀",
    "STONKS 📈",
    "IT'S OVER 9000!",
    "BOHOT HARD! 🔥",
    "KYA BOLTI PUBLIC? 😎",
    "JALWA HAI HAMARA! ✨",
    "DEAL WITH IT 😎"
];

// Selectors
const overlay = document.getElementById('meme-mode-overlay');
const memeContainer = document.getElementById('meme-container');
const emojiContainer = document.getElementById('emoji-container');
const quoteContainer = document.getElementById('quote-container');
const closeBtn = document.getElementById('close-meme-mode');
const soundBtn = document.getElementById('toggle-sound');
const achievementPopup = document.getElementById('achievement-popup');
const kbdElements = document.querySelectorAll('.controls kbd');

// Initialize
window.addEventListener('load', () => {
    if (localStorage.getItem('memeModeActive') === 'true') {
        activateMemeMode(true); // Pass true to skip sound/achievement on reload
    }
});

soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
        soundBtn.textContent = '🔊 Disable Sound';
        playActivationSound();
    } else {
        soundBtn.textContent = '🔈 Enable Sound';
    }
});

window.addEventListener('keydown', (e) => {
    if (konamiIndex < KONAMI_CODE.length && e.key.toLowerCase() === KONAMI_CODE[konamiIndex].toLowerCase()) {
        kbdElements[konamiIndex].classList.add('active');
    }
});

window.addEventListener('keyup', (e) => {
    if (konamiIndex < KONAMI_CODE.length && e.key.toLowerCase() === KONAMI_CODE[konamiIndex].toLowerCase()) {
        kbdElements[konamiIndex].classList.remove('active');
        konamiIndex++;

        if (konamiIndex === KONAMI_CODE.length) {
            activateMemeMode();
            konamiIndex = 0;
        }
    } else {
        // Reset progress on mistake
        kbdElements.forEach(k => k.classList.remove('active'));
        
        if (e.key.toLowerCase() === KONAMI_CODE[0].toLowerCase()) {
            konamiIndex = 1;
            kbdElements[0].classList.remove('active'); // Ensure first is clear
        } else {
            konamiIndex = 0;
        }
    }
});

closeBtn.addEventListener('click', deactivateMemeMode);

// Audio Synthesis
async function playActivationSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    // Funny "Tada/Slide" sound
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    
    const time = audioCtx.currentTime;
    osc.frequency.setValueAtTime(100, time);
    osc.frequency.exponentialRampToValueAtTime(800, time + 0.3);
    osc.frequency.exponentialRampToValueAtTime(400, time + 0.5);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.6);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(time);
    osc.stop(time + 0.6);
}

function playMemeSpawnSound() {
    if (!soundEnabled) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') return;

    // Funny "Boing/Pop" sound
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    
    const time = audioCtx.currentTime;
    const randomPitch = 200 + Math.random() * 600;
    osc.frequency.setValueAtTime(randomPitch, time);
    osc.frequency.exponentialRampToValueAtTime(10, time + 0.15);

    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(time);
    osc.stop(time + 0.15);
}

// Activation Logic
function activateMemeMode(isReload = false) {
    if (memeModeActive) return;
    memeModeActive = true;
    localStorage.setItem('memeModeActive', 'true');

    // UI Updates
    document.body.classList.add('meme-mode-active');
    document.body.classList.add('shake-active');
    overlay.classList.remove('hidden');

    // Remove shake after 3 seconds
    setTimeout(() => {
        document.body.classList.remove('shake-active');
    }, 3000);

    // Effects (skip if just reloading)
    if (!isReload) {
        if (soundEnabled) playActivationSound();
        triggerConfetti();
        checkAchievement();
    }

    // Start Intervals
    memeInterval = setInterval(spawnMeme, 2000);
    emojiInterval = setInterval(spawnEmoji, 500);
    quoteInterval = setInterval(spawnQuote, 3500);

    // Cursor Trail
    window.addEventListener('mousemove', createCursorTrail);

    // Initial Spawns
    spawnMeme();
    spawnQuote();
}

function deactivateMemeMode() {
    memeModeActive = false;
    localStorage.setItem('memeModeActive', 'false');
    document.body.classList.remove('meme-mode-active');
    document.body.classList.remove('shake-active');
    overlay.classList.add('hidden');

    // Stop Intervals
    clearInterval(memeInterval);
    clearInterval(emojiInterval);
    clearInterval(quoteInterval);

    // Remove Event Listeners
    window.removeEventListener('mousemove', createCursorTrail);

    // Clear Containers
    memeContainer.innerHTML = '';
    emojiContainer.innerHTML = '';
    quoteContainer.innerHTML = '';
}

function createCursorTrail(e) {
    if (!memeModeActive) return;
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    trail.style.left = `${e.clientX}px`;
    trail.style.top = `${e.clientY}px`;
    document.body.appendChild(trail);

    setTimeout(() => trail.remove(), 500);
}

// Spawning Functions
function spawnMeme() {
    const img = document.createElement('img');
    img.src = MEME_IMAGES[Math.floor(Math.random() * MEME_IMAGES.length)];
    img.className = 'meme-img';
    
    // Random position
    const x = Math.random() * (window.innerWidth - 250);
    const y = Math.random() * (window.innerHeight - 250);
    const rotation = (Math.random() - 0.5) * 30;

    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
    img.style.transform = `rotate(${rotation}deg)`;

    memeContainer.appendChild(img);
    playMemeSpawnSound();

    // Cleanup
    setTimeout(() => img.remove(), 3000);
}

function spawnEmoji() {
    const emoji = document.createElement('div');
    emoji.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    emoji.className = 'floating-emoji';
    
    const x = Math.random() * window.innerWidth;
    emoji.style.left = `${x}px`;

    emojiContainer.appendChild(emoji);

    // Cleanup
    setTimeout(() => emoji.remove(), 4000);
}

function spawnQuote() {
    const quote = document.createElement('div');
    quote.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    quote.className = 'meme-quote';

    const x = Math.random() * (window.innerWidth - 200);
    const y = Math.random() * (window.innerHeight - 100);

    quote.style.left = `${x}px`;
    quote.style.top = `${y}px`;

    quoteContainer.appendChild(quote);

    // Cleanup
    setTimeout(() => quote.remove(), 4000);
}

// Extras
function triggerConfetti() {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#38bdf8', '#818cf8', '#f472b6']
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#38bdf8', '#818cf8', '#f472b6']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

function checkAchievement() {
    if (!localStorage.getItem('memeLordUnlocked')) {
        achievementPopup.classList.add('show');
        localStorage.setItem('memeLordUnlocked', 'true');
        
        setTimeout(() => {
            achievementPopup.classList.remove('show');
        }, 5000);
    }
}
