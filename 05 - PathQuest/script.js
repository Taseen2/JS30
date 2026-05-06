/* ─── Story Data ──────────────────────────────────────────────────────────── */
const STORY = {
  1: {
    label: 'Choice 1',
    title: 'Follow the River Path',
    story: 'You run toward the Ganga ghats, where boats sway in the water and tiny lamps float like gold stars. A boatman says he saw someone in a red shawl heading downstream.',
    icon: '🚣',
    subs: {
      A: {
        icon: '⛵',
        label: '1A',
        title: 'Jump into a boat and chase them',
        ending: 'happy',
        endingIcon: '🌸',
        endingTitle: 'The Borrowed Lamp',
        story: `You paddle fast through the mist. The red shawl is tied to a post on an old boat. Inside, you find the lamp... and a smiling child who says, <em>"I only borrowed it to guide my lost puppy."</em>\n\nYou return the lamp — and the puppy too. The priest blesses you, and the child gives you a <strong>flower garland</strong> as thanks. The ghats erupt in light.`
      },
      B: {
        icon: '🌊',
        label: '1B',
        title: 'Follow the footprints along the mud',
        ending: 'mysterious',
        endingIcon: '🌙',
        endingTitle: 'The Hidden Shrine',
        story: `The footprints lead to a quiet river cave with old carvings of Ganga Mata. Inside, you find the lamp resting before a hidden shrine.\n\nA soft voice says, <em>"You found what was never truly lost."</em> When you turn back, the cave is gone — but the lamp is warm in your hands.`
      },
      C: {
        icon: '🏮',
        label: '1C',
        title: 'Ask the boatman for help',
        ending: 'happy',
        endingIcon: '🎊',
        endingTitle: 'The River\'s Own Riddle',
        story: `He laughs and says, <em>"First solve my riddle."</em> He asks: <strong>"What shines without fire, flows without legs, and blesses without speaking?"</strong>\n\nYou answer: <em>"The river."</em> He grins and points you to the correct boat. You recover the lamp and learn the river itself was part of the test.`
      }
    }
  },
  2: {
    label: 'Choice 2',
    title: 'Enter the Crowded Market',
    story: 'You rush into the lanes of Varanasi market, where bangles sparkle, chai stalls hiss, and old songs play from tiny speakers. A strange girl in a yellow dupatta keeps looking at you.',
    icon: '🛍️',
    subs: {
      A: {
        icon: '🌟',
        label: '2A',
        title: 'Chase the girl through the market',
        ending: 'mysterious',
        endingIcon: '✨',
        endingTitle: 'A Clue in the Crowd',
        story: `She leads you through silk shops, spice stalls, and a toy seller's corner. At last, she stops and hands you a small box.\n\nInside is not the lamp, but a clue: <em>"The lamp sleeps where music never stops."</em> The girl disappears into the crowd. You realize she was <strong>guiding you all along</strong>.`
      },
      B: {
        icon: '🍯',
        label: '2B',
        title: 'Search the sweet shop',
        ending: 'happy',
        endingIcon: '🎉',
        endingTitle: 'Jalebi & Justice',
        story: `You smell jalebi and gujiya. Behind the counter, the shopkeeper says someone asked for <em>"one lamp-shaped sweet box."</em>\n\nYou find the real lamp hidden inside a <strong>giant dhol drum</strong> used for the festival parade. You save the lamp just in time — and the shopkeeper gives you free sweets!`
      },
      C: {
        icon: '🔮',
        label: '2C',
        title: 'Trust the old fortune teller',
        ending: 'bad',
        endingIcon: '😔',
        endingTitle: 'Too Late',
        story: `She reads your palm and says, <em>"The lamp was taken by someone who fears light, not darkness."</em> She points toward the temple tower.\n\nWhen you reach the tower, the thief is gone, and you are <strong>too late</strong>. The festival bells ring sadly. The city still glows, but the sacred lamp is lost for now.`
      }
    }
  },
  3: {
    label: 'Choice 3',
    title: 'Climb the Temple Tower',
    story: 'You head to the tall ancient temple tower, where bells swing in the wind and monkeys leap across the stone walls. The sky is turning deep blue.',
    icon: '🏛️',
    subs: {
      A: {
        icon: '🙏',
        label: '3A',
        title: 'Climb quietly through the side stairs',
        ending: 'happy',
        endingIcon: '🪔',
        endingTitle: 'The Monk\'s Test',
        story: `At the top, you find an old monk guarding the lamp. He says it was hidden to <em>test your courage</em>.\n\nYou prove your kindness, and he returns the lamp with a gentle smile. The festival feels <strong>brighter than ever</strong> as the diyas reflect in the Ganga below.`
      },
      B: {
        icon: '🌀',
        label: '3B',
        title: 'Call out loudly for the thief',
        ending: 'mysterious',
        endingIcon: '💙',
        endingTitle: 'The Blue Lamp',
        story: `Your voice echoes through the tower. A shadow runs. You chase it and uncover a <em>secret tunnel</em> under the temple floor.\n\nInside, you find ancient carvings and a second lamp glowing <strong>blue</strong>. The thief is gone, but the blue lamp remains. Nobody knows who made it.`
      },
      C: {
        icon: '🐒',
        label: '3C',
        title: 'Use a firecracker to scare the monkeys',
        ending: 'bad',
        endingIcon: '💧',
        endingTitle: 'Lost to the River',
        story: `The monkeys panic and run everywhere. One drops a cloth bag from the ledge. The lamp rolls out... but falls <strong>straight into the river below</strong>.\n\nThe lamp is lost in the water. The priest is sad, and you feel guilty as the <em>drums slowly fade</em> into the night.`
      }
    }
  }
};

/* ─── State ───────────────────────────────────────────────────────────────── */
let activeChoice = null;  // 1, 2, or 3
let openPanel    = null;  // DOM element

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  el.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeAllPanels(container) {
  container.querySelectorAll('.panel').forEach(p => {
    p.classList.remove('open', 'open-active');
  });
  openPanel = null;
}

/* ─── Level-1 Panels ──────────────────────────────────────────────────────── */
function initLevel1() {
  const panels = document.querySelectorAll('#level1-panels .panel');

  panels.forEach(panel => {
    panel.addEventListener('click', function () {
      const choice = parseInt(this.dataset.choice);

      if (this.classList.contains('open')) {
        // Already open → navigate to level 2
        goToLevel2(choice);
        return;
      }

      // Close others, open this
      closeAllPanels(document.getElementById('level1-panels'));
      this.classList.add('open');
      openPanel = this;
    });

    panel.addEventListener('transitionend', function (e) {
      if (e.propertyName.includes('flex')) {
        this.classList.toggle('open-active', this.classList.contains('open'));
      }
    });
  });
}

function goToLevel2(choice) {
  activeChoice = choice;
  const data = STORY[choice];

  // Populate header
  document.getElementById('choiceHeader').innerHTML = `
    <div class="choice-label">${data.label}</div>
    <h2>${data.title}</h2>
  `;

  // Populate story
  document.getElementById('choiceStory').textContent = data.story;

  // Build sub-panels
  const container = document.getElementById('level2-panels');
  container.innerHTML = '';

  ['A', 'B', 'C'].forEach(key => {
    const sub = data.subs[key];
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.dataset.sub = key;
    panel.innerHTML = `
      <div class="panel-inner">
        <div class="sub-icon">${sub.icon}</div>
        <div class="sub-label">${sub.label}</div>
        <h3 class="sub-title">${sub.title}</h3>
        <span class="ending-tag ${sub.ending}">${sub.ending.charAt(0).toUpperCase() + sub.ending.slice(1)} Ending</span>
      </div>
    `;

    panel.addEventListener('click', function () {
      showEnding(choice, key);
    });

    container.appendChild(panel);
  });

  showScreen('screen-choice');
}

/* ─── Ending ──────────────────────────────────────────────────────────────── */
function showEnding(choice, subKey) {
  const sub = STORY[choice].subs[subKey];

  // Badge
  document.getElementById('endingBadge').textContent = sub.endingIcon;

  // Title
  document.getElementById('endingTitle').textContent = sub.endingTitle;

  // Type label
  const typeLabel = document.createElement('div');
  typeLabel.className = `ending-type-label ${sub.ending}`;
  typeLabel.textContent = sub.ending.charAt(0).toUpperCase() + sub.ending.slice(1) + ' Ending';

  // Story (supports HTML)
  const storyEl = document.getElementById('endingStory');
  storyEl.innerHTML = sub.story.replace(/\n/g, '<br/><br/>');

  // Insert type label before story
  const wrap = document.querySelector('.ending-wrap');
  const existingLabel = wrap.querySelector('.ending-type-label');
  if (existingLabel) existingLabel.remove();
  storyEl.before(typeLabel);

  showScreen('screen-ending');
}

/* ─── Navigation ──────────────────────────────────────────────────────────── */
document.getElementById('backBtn').addEventListener('click', () => {
  showScreen('screen-intro');
});

document.getElementById('backBtn2').addEventListener('click', () => {
  // Go back to level 2 for current choice
  if (activeChoice) {
    goToLevel2(activeChoice);
  } else {
    showScreen('screen-intro');
  }
});

document.getElementById('restartBtn').addEventListener('click', () => {
  activeChoice = null;
  openPanel = null;
  closeAllPanels(document.getElementById('level1-panels'));
  showScreen('screen-intro');
});

/* ─── Init ────────────────────────────────────────────────────────────────── */
initLevel1();
