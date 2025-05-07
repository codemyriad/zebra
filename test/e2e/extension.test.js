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
    // A common way to get an extension's ID is to open its manifest.json
    // or any known page from the extension and parse the URL.
    // However, a more robust way is to find a target belonging to the extension.
    const targets = browser.targets();
    for (const target of targets) {
        if (target.url().startsWith('chrome-extension://')) {
            const url = target.url();
            // URL is like chrome-extension://<id>/_generated_background_page.html
            const extensionId = new URL(url).hostname;
            if (extensionId) {
                return extensionId;
            }
        }
    }
    throw new Error('Could not determine extension ID.');
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
