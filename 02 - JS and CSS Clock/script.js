/**
 * Analog Clock - Real-time display of India Standard Time (IST)
 * Updates clock hands every 1 second
 */

if (typeof document !== 'undefined') {
    // DOM Elements
    const secondHand = document.querySelector('.second-hand');
    const minuteHand = document.querySelector('.min-hand');
    const hourHand = document.querySelector('.hour-hand');

    /**
     * Update clock hands to current time
     * Converts UTC to India Standard Time (IST/Asia/Kolkata)
     */
    function updateClock() {
        // Get current time in IST timezone
        const now = new Date();
        const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

        // Extract time components
        const seconds = istTime.getSeconds();
        const minutes = istTime.getMinutes();
        const hours = istTime.getHours();

        // Convert time to rotation degrees (360° = full rotation)
        // +90deg offset aligns 12 o'clock with 0 degrees
        const secondDegrees = (seconds / 60) * 360 + 90;
        const minuteDegrees = (minutes / 60) * 360 + (seconds / 60) * 6 + 90;
        const hourDegrees = (hours / 12) * 360 + (minutes / 60) * 30 + 90;

        // Avoid visual "rewind" glitch when a hand jumps from ~360deg back to 0deg
        // If seconds === 0 the second hand resets — temporarily disable its transition
        if (seconds === 0) {
            secondHand.style.transition = 'none';
        } else {
            secondHand.style.transition = '';
        }

        // When minutes roll over from 59 -> 0 (i.e., minutes===0 and seconds===0)
        // the minute (and hour) hand can appear to rotate backwards due to CSS
        // interpolation between ~450deg -> 90deg. Disable transition for that tick.
        const isMinuteReset = minutes === 0 && seconds === 0;
        if (isMinuteReset) {
            minuteHand.style.transition = 'none';
            hourHand.style.transition = 'none';
        } else {
            minuteHand.style.transition = '';
            hourHand.style.transition = '';
        }

        // Apply rotation transforms to hand elements
        secondHand.style.transform = `rotate(${secondDegrees}deg)`;
        minuteHand.style.transform = `rotate(${minuteDegrees}deg)`;
        hourHand.style.transform = `rotate(${hourDegrees}deg)`;

        // Re-enable transitions after the instant jump so subsequent moves animate
        if (seconds === 0) {
            setTimeout(() => { secondHand.style.transition = ''; }, 50);
        }
        if (isMinuteReset) {
            setTimeout(() => {
                minuteHand.style.transition = '';
                hourHand.style.transition = '';
            }, 50);
        }
    }

    // Initialize clock immediately on page load
    updateClock();

    // Update clock every 1 second
    setInterval(updateClock, 1000);
}