import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

// Replicate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the built extension (dist directory)
// Assumes this script is in project_root/test/e2e/
const extensionPath = path.resolve(__dirname, '..', '..', 'dist');
const extensionManifestPath = path.resolve(extensionPath, 'manifest.json'); // For getting extension ID

async function getExtensionId(browser) {
    console.log("Attempting to find an extension target to determine ID...");
    // Wait for the service worker target of the extension to appear.
    // This is more reliable as it waits for the extension to initialize.
    const extensionTarget = await browser.waitForTarget(
        (target) => target.type() === 'service_worker' && target.url().startsWith('chrome-extension://'),
        { timeout: 10000 } // Wait up to 10 seconds
    );

    if (!extensionTarget) {
        // If still not found, try to list all targets for debugging
        const allTargets = await browser.targets();
        console.error("All available targets:", allTargets.map(t => ({ type: t.type(), url: t.url() })));
        throw new Error('Could not find the service worker target for the extension within the timeout.');
    }

    const targetUrl = extensionTarget.url();
    console.log(`Found extension target (service worker) with URL: ${targetUrl}`);
    // The URL will be something like: chrome-extension://<extension_id>/service_worker_script_name.js
    const extensionId = new URL(targetUrl).hostname;

    if (!extensionId) {
        throw new Error(`Could not parse extension ID from URL: ${targetUrl}`);
    }
    return extensionId;
}

async function runTests() {
    let browser;
    console.log(`Attempting to load extension from: ${extensionPath}`);

    try {
        browser = await puppeteer.launch({
            headless: 'new', // Use 'new' for modern headless mode
            args: [
                `--disable-extensions-except=${extensionPath}`,
                `--load-extension=${extensionPath}`,
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
        });
        console.log('Browser launched with extension.');

        const extensionId = await getExtensionId(browser);
        console.log(`Detected Extension ID: ${extensionId}`);

        // Test 1: Verify Service Worker is active
        console.log('Running Test: Verify Service Worker is active');
        const serviceWorkerTarget = await browser.waitForTarget(
            (target) => target.type() === 'service_worker' && target.url().startsWith(`chrome-extension://${extensionId}`)
        );

        assert.ok(serviceWorkerTarget, 'Service worker target should be found.');
        const serviceWorker = await serviceWorkerTarget.worker();
        assert.ok(serviceWorker, 'Service worker instance should be obtainable.');
        console.log('Service worker is active.');
        console.log('Test PASSED: Verify Service Worker is active');


        // Future functional tests can be added here as separate async functions
        // await testPopupOpens(browser, extensionId);
        // await testOptionsPage(browser, extensionId);

        console.log('All tests passed successfully!');

    } catch (error) {
        console.error('Test suite failed:', error);
        process.exit(1); // Exit with error code to fail CI
    } finally {
        if (browser) {
            await browser.close();
            console.log('Browser closed.');
        }
    }
}

runTests();
