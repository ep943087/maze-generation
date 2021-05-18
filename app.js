import {Maze} from './maze/Maze.js';

const c = document.querySelector("#myCanvas");
const ctx = c.getContext('2d');
const maze = new Maze(c);


window.onload = () => {
  draw();
  setInterval(()=>maze.update(), 10);
};


const draw = () => {
  c.width = c.clientWidth;
  c.height = c.clientHeight;

  requestAnimationFrame(draw);
  ctx.fillStyle = "black";
  ctx.clearRect(0,0,c.width,c.height);
  ctx.fillRect(0,0,c.width,c.height);

  maze.draw();

}
