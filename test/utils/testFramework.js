import { logger } from '../../src/utils/logger.js';

const testLogger = logger.child('TEST');

class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.beforeEachFn = null;
    this.afterEachFn = null;
  }

  beforeEach(fn) {
    this.beforeEachFn = fn;
  }

  afterEach(fn) {
    this.afterEachFn = fn;
  }

  test(description, testFn) {
    this.tests.push({ description, testFn });
  }

  async run() {
    testLogger.info(`Running test suite: ${this.name}`);
    let passed = 0;
    let failed = 0;
    const results = [];

    for (const { description, testFn } of this.tests) {
      testLogger.info(`  Testing: ${description}`);
      
      try {
        if (this.beforeEachFn) await this.beforeEachFn();
        
        await testFn();
        
        if (this.afterEachFn) await this.afterEachFn();
        
        testLogger.info(`  ✅ PASS: ${description}`);
        passed++;
        results.push({ description, status: 'PASS' });
      } catch (error) {
        testLogger.error(`  ❌ FAIL: ${description}`, { error: error.message });
        failed++;
        results.push({ description, status: 'FAIL', error: error.message });
      }
    }

    testLogger.info(`Suite ${this.name} completed: ${passed} passed, ${failed} failed`);
    return { passed, failed, results };
  }
}

function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertNotEqual(actual, expected, message) {
  if (actual === expected) {
    throw new Error(message || `Expected ${actual} to not equal ${expected}`);
  }
}

function assertContains(haystack, needle, message) {
  if (!haystack.includes(needle)) {
    throw new Error(message || `Expected "${haystack}" to contain "${needle}"`);
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    throw new Error(message || 'Expected function to throw an error');
  } catch (error) {
    // Expected behavior
  }
}

export { TestSuite, assert, assertEqual, assertNotEqual, assertContains, assertThrows }; 