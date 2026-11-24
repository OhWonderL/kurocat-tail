import assert from 'node:assert/strict';
import { build } from 'esbuild';

try {
  const bundle = await build({
    entryPoints: ['src/catEngine.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
  });
  const source = Buffer.from(bundle.outputFiles[0].text).toString('base64');
  const { KuroCatEngine } = await import('data:text/javascript;base64,' + source);

  let now = 0;
  Object.defineProperty(globalThis, 'performance', { value: { now: () => now } });
  globalThis.window = { devicePixelRatio: 1, addEventListener() {} };
  const engine = new KuroCatEngine({ getContext: () => ({}), style: {} });

  engine.onKeyDown(0xa2, false);
  engine.onKeyDown(0xa0, false);
  engine.onKeyDown(0xa2, true);
  assert.deepEqual(engine.modifierOrder, [0xa2, 0xa0]);
  engine.onKeyUp(0xa0);
  assert.deepEqual(engine.modifierOrder, [0xa2]);

  now = 3000;
  engine.onGlobalMouseMove(0.5, 0.5, { x: 20, y: 20 });
  assert.equal(engine.groomStarted, -Infinity);
  engine.onKeyUp(0xa2);

  now = 4999;
  engine.onGlobalMouseMove(0.5, 0.5, { x: 25, y: 20 });
  assert.equal(engine.groomStarted, -Infinity);
  now = 5000;
  engine.onGlobalMouseMove(0.5, 0.5, { x: 40, y: 30 });
  assert.equal(engine.groomStarted, 5000);
  assert.ok(engine.mouseTargetOffsetX > 0);
  engine.update(1 / 60, now);
  assert.ok(engine.tailReach > 0);

  engine.onKeyDown(0x41, false);
  assert.equal(engine.groomStarted, -Infinity);
  engine.onKeyUp(0x41);
  engine.onMouseDown('left');
  for (let frame = 0; frame < 20; frame++) {
    engine.update(1 / 60, now + frame * 1000 / 60);
  }
  assert.notEqual(engine.leftPaw.mode, 'mouse');
  engine.onMouseUp('left');
  now = 13799;
  engine.onMouseDown('right');
  assert.equal(engine.groomStarted, -Infinity);
  now = 13800;
  engine.onGlobalMouseMove(0.5, 0.5);
  assert.equal(engine.groomStarted, 13800);

  engine.setPrivacyMode(true);
  engine.onMouseDown('left');
  assert.equal(engine.mouseLeftDown, false);
  assert.equal(engine.mouseRightDown, false);
  assert.equal(engine.tailReach, 0);
  assert.equal(engine.groomStarted, -Infinity);
  console.log('Tail, grooming and privacy input checks passed');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
