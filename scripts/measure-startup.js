import { spawn } from 'child_process';
import electron from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const REPEATS = 10;
const APP_PATH = path.resolve(__dirname, '../out/main/index.js'); // Updated to out directory

async function runMeasurement(iteration) {
    return new Promise((resolve, reject) => {
        const start = performance.now();
        let bootTime = null;

        const child = spawn(electron, ['.'], {
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
                ...process.env,
                PERFORMANCE_TEST: 'true'
            }
        });

        // Timeout to kill process if it takes too long
        const timeout = setTimeout(() => {
            child.kill();
            reject(new Error('Timeout waiting for app ready (30s exceeded)'));
        }, 30000);

        child.stdout.on('data', (data) => {
            const output = data.toString();
            // DEBUG: Show app output to see why it's failing
            // process.stdout.write(`  [APP] ${output}`); 

            const match = output.match(/PERF: boot-time=(\d+)ms/);
            if (match) {
                bootTime = parseInt(match[1], 10);
                clearTimeout(timeout);
                child.kill();
                resolve(bootTime);
            }
        });

        child.stderr.on('data', (data) => {
            process.stdout.write(`  [STERR] ${data.toString()}`);
        });

        child.on('close', (code) => {
            if (bootTime === null) {
                // reject(new Error(`App closed without reporting metrics. Code: ${code}`));
                // For now, if we don't implement the log yet, this will fail.
                // We resolve with null to allow testing the script before app instrumentation.
                resolve(null);
            }
        });
    });
}

(async () => {
    console.log(`Starting performance measurement (${REPEATS} runs)...`);
    console.log('--------------------------------------------------');
    const results = [];

    for (let i = 0; i < REPEATS; i++) {
        const isCold = i === 0;
        process.stdout.write(`Run ${i + 1}/${REPEATS} [${isCold ? 'COLD' : 'WARM'}]: `);
        try {
            const time = await runMeasurement(i);
            if (time !== null) {
                console.log(`${time}ms`);
                results.push(time);
            } else {
                console.log('No metric received (Not instrumented yet?)');
            }
        } catch (e) {
            console.log(`Failed: ${e.message}`);
        }
    }

    if (results.length > 0) {
        const coldStart = results[0];
        const warmStarts = results.slice(1);

        console.log('\n--------------------------------------------------');
        console.log('PERFORMANCE REPORT');
        console.log('--------------------------------------------------');
        console.log(`Cold Start (Run 1): ${coldStart}ms`);

        if (warmStarts.length > 0) {
            const avgWarm = warmStarts.reduce((a, b) => a + b, 0) / warmStarts.length;
            const minWarm = Math.min(...warmStarts);
            const maxWarm = Math.max(...warmStarts);
            // Calculate Standard Deviation
            const stdDev = Math.sqrt(warmStarts.reduce((acc, val) => acc + Math.pow(val - avgWarm, 2), 0) / warmStarts.length);

            // Calculate Percentiles
            const sortedWarm = [...warmStarts].sort((a, b) => a - b);
            const getPercentile = (p) => sortedWarm[Math.floor((sortedWarm.length - 1) * p)];
            const p95 = getPercentile(0.95);
            const p99 = getPercentile(0.99);

            console.log(`Warm Start Avg    : ${avgWarm.toFixed(2)}ms (n=${warmStarts.length})`);
            console.log(`Warm Start Range  : ${minWarm}ms - ${maxWarm}ms`);
            console.log(`Warm Start Stdev  : ${stdDev.toFixed(2)}ms`);
            console.log(`Warm Start P95    : ${p95}ms`);
            console.log(`Warm Start P99    : ${p99}ms`);
        } else {
            console.log('Warm Start        : N/A (Not enough runs)');
        }
        console.log('--------------------------------------------------');
    } else {
        console.log('\nNo meaningful data collected.');
    }
})();
