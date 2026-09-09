# Joint Doll

A basic webapp where a stick doll with a few joints (head, arms, legs)
moves according to simple commands you type into a code panel.

## Run it

Option 1 — no Python needed:
Just open `index.html` in a browser.

Option 2 — via the included Python server:
```
pip install flask
python app.py
```
Then open http://localhost:5000

## Writing movement code

```
move <joint> <angle> <ms>   # rotate a joint to an angle (degrees) over ms milliseconds
wait <ms>                   # pause before the next command
reset                       # return every joint to 0 degrees
# comment                   # ignored line
```

Joints available: `head`, `leftArm`, `rightArm`, `leftLeg`, `rightLeg`

Click "Load Sample Code" in the app for a working example (a wave + a step).