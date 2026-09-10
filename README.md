# Rig Lab

Rig Lab is a zero-install browser playground for directing a tiny jointed character with JavaScript or the included Python command dialect. Write a movement sequence, run it locally, and watch the rig respond joint by joint.

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
physics({ gravity: 0.16, bounce: 0.48, damping: 0.88 });
await impulse({ y: -3.5 });
await wait(200);
await resetPose(300);
```

Joint angles are in degrees, with `0` pointing straight down. Available joints are `spine`, `leftShoulder`, `rightShoulder`, `leftElbow`, `rightElbow`, `leftWrist`, `rightWrist`, `leftHip`, `rightHip`, `leftKnee`, `rightKnee`, `leftAnkle`, and `rightAnkle`.

The editor language selector supports JavaScript and a deliberately small Python command mode. Python commands such as `set_joints(...)`, `set_body(...)`, `wait(...)`, `physics(...)`, and `reset_pose(...)` are translated locally into the same animation engine; no Python runtime or server is required.

The lightweight physics layer adds gravity, bounce, damping, impulses, and a spring-ready controller configuration. The stage toggle can pause physics while the script editor remains available. The rig currently exposes 13 joints, including the articulated spine hinge.

Your code runs locally in the current browser tab; it is not sent anywhere.
