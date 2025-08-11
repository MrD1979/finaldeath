// ==UserScript==
// @name         Deadshot.io No Recoil + Visuals + HUD
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Removes recoil/spread, adds shot prediction, heatmap overlay, and toggle HUD
// @author       You
// @match        *://deadshot.io/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let enabled = true;

    // Create status HUD
    const hud = document.createElement('div');
    hud.style.position = 'fixed';
    hud.style.top = '10px';
    hud.style.left = '10px';
    hud.style.padding = '6px 10px';
    hud.style.fontFamily = 'monospace';
    hud.style.fontSize = '14px';
    hud.style.borderRadius = '4px';
    hud.style.background = 'rgba(0, 0, 0, 0.5)';
    hud.style.color = 'lime';
    hud.style.zIndex = '9999';
    hud.textContent = 'No Recoil: ON';
    document.body.appendChild(hud);

    function updateHUD() {
        hud.textContent = `No Recoil: ${enabled ? 'ON' : 'OFF'}`;
        hud.style.color = enabled ? 'lime' : 'red';
    }

    // Toggle key: Ctrl + Shift + F1
    window.addEventListener('keydown', e => {
        if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'F1') {
            e.preventDefault();
            enabled = !enabled;
            updateHUD();
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

    // Keep trying until found
    const hookInterval = setInterval(() => {
        if (hookSpread()) {
            console.log('randFloatSpread hooked successfully');
            clearInterval(hookInterval);
        }
    }, 1000);

    // Overlay canvas
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
            const now = Date.now();
            shots = shots.filter(s => now - s.time < 3000);
            for (let shot of shots) {
                const age = (now - shot.time) / 3000;
                ctx.beginPath();
                ctx.arc(shot.x, shot.y, 10 * (1 - age), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,0,0,${1 - age})`;
                ctx.fill();
            }

            // Ghost aim point
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