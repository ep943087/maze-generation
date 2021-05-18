import {Transformations, getRectangle, getCircle} from './transformations/transforms.js';

const c = document.querySelector("#myCanvas");
const ctx = c.getContext('2d');
const transforms = new Transformations(c);


window.onload = () => draw();

const rect = getRectangle(100,100,50,50);
const circle = getCircle(50,50,25,25);

const draw = () => {
  requestAnimationFrame(draw);
  ctx.fillStyle = "blue";
  ctx.clearRect(0,0,c.width,c.height);
  ctx.fillRect(0,0,c.width,c.height);

  transforms.drawShape(rect,"red",true);
  transforms.drawShape(circle,"green",false);
  transforms.drawLine(rect,'black');

  transforms.translateShape(rect,.1,.1);

  const centerRect = transforms.getShapeCenter(rect);
  transforms.rotateShape(rect,Math.PI*2/30,centerRect);
}