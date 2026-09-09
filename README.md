# Rig Lab

Rig Lab is a zero-install browser playground for directing a tiny jointed character with JavaScript. Write a movement sequence, run it locally, and watch the rig respond joint by joint.

## Run it

Open `index.html` directly in a browser, or use the included Python server:

```bash
python3 -m http.server 4173
```

Then visit <http://localhost:4173>.

## Controls

- **Run code** executes the script in the editor. `⌘/Ctrl + Enter` is a shortcut.
- **Stop** interrupts an active sequence.
- **Reset pose** returns the rig and body transform to rest.
- **Load** inserts one of the sample moves: wave, walk, run, jump, or backflip.
- **Quick insert** adds a command at the current cursor position.

## Movement API

All movement commands return a promise and can be `await`ed:

```js
await setJoints({ rightShoulder: -120, rightElbow: 35 }, 400);
await setBody({ x: 10, y: -40, rot: 15 }, 300);
await wait(200);
await resetPose(300);
```

Joint angles are in degrees, with `0` pointing straight down. Available joints are `leftShoulder`, `rightShoulder`, `leftElbow`, `rightElbow`, `leftWrist`, `rightWrist`, `leftHip`, `rightHip`, `leftKnee`, `rightKnee`, `leftAnkle`, and `rightAnkle`.

Your code runs locally in the current browser tab; it is not sent anywhere.
