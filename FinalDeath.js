// ==UserScript==
// @name         Deadshot.io No Recoil + Visuals
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Removes recoil/spread, adds shot prediction and heatmap overlay
// @author       You
// @match        *://deadshot.io/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let enabled = true;
    const toggleKey = 'F1';

    // Listen for toggle
    window.addEventListener('keydown', e => {
        if (e.key.toUpperCase() === toggleKey) {
            enabled = !enabled;
            console.log(`No Recoil Script: ${enabled ? 'ON' : 'OFF'}`);
        }
    });

    // Hook into game's spread/recoil
    const hookSpread = () => {
        for (let key in window) {
            let obj = window[key];
            if (obj && typeof obj === 'object') {
                for (let subKey in obj) {
                    if (
                        typeof obj[subKey] === 'function' &&
                        /randFloatSpread/.test(obj[subKey].toString())
                    ) {
                        console.log('Found randFloatSpread in', key, subKey);
                        const original = obj[subKey];
                        obj[subKey] = function (range) {
                            if (enabled) return 0;
                            return original.apply(this, arguments);
                        };
                        return true;
                    }
                }
            }
        }
        return false;
    };

    // Try hooking repeatedly until found
    const hookInterval = setInterval(() => {
        if (hookSpread()) {
            console.log('randFloatSpread hooked successfully');
            clearInterval(hookInterval);
        }
    }, 1000);

    // Create overlay
    const overlay = document.createElement('canvas');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.pointerEvents = 'none';
    overlay.width = window.innerWidth;
    overlay.height = window.innerHeight;
    document.body.appendChild(overlay);
    const ctx = overlay.getContext('2d');

    let shots = [];

    // Track clicks for heatmap
    window.addEventListener('click', e => {
        if (!enabled) return;
        shots.push({ x: e.clientX, y: e.clientY, time: Date.now() });
    });

    // Draw overlay
    function drawOverlay() {
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        if (enabled) {
            // Heatmap
            const now = Date.now();
            shots = shots.filter(s => now - s.time < 3000); // keep 3s
            for (let shot of shots) {
                const age = (now - shot.time) / 3000;
                ctx.beginPath();
                ctx.arc(shot.x, shot.y, 10 * (1 - age), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,0,0,${1 - age})`;
                ctx.fill();
            }

            // Recoil ghost (example static offset)
            const cx = overlay.width / 2;
            const cy = overlay.height / 2;
            ctx.beginPath();
            ctx.arc(cx, cy - 30, 5, 0, Math.PI * 2);
            ctx.strokeStyle = 'yellow';
            ctx.stroke();
        }

        requestAnimationFrame(drawOverlay);
    }
    drawOverlay();

})();