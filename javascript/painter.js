$(document).ready(function() {
  var $canvas = $('.canvas');
  $canvas.svg();
  var svg = $canvas.svg('get');
  var isMouseDown = false;
  var dragStart;

  $canvas.mousedown(function(event) {
    isMouseDown = true;
    onDragStart(event.clientX, event.clientY);
  });

  $canvas.mouseup(function() {
    isMouseDown = false;
  });

  $canvas.mouseleave(function() {
    isMouseIn = false;
    isMouseDown = false;
  });

  $canvas.mouseenter(function() {
    isMouseIn = true;
  });

  $canvas.mousemove(function(event) {
    if (isMouseIn && isMouseDown) {
      onDragMove(event.clientX, event.clientY);
    }
  });

  $canvas.on('touchstart', function(event) {
    event.preventDefault();
    var x = event.originalEvent.touches[0].clientX;
    var y = event.originalEvent.touches[0].clientY;
    dragStart = [x, y];
  });

  $canvas.on('touchmove', function(event) {
    event.preventDefault();
    var x = event.originalEvent.touches[0].clientX;
    var y = event.originalEvent.touches[0].clientY;
    onDragMove(x, y);
  });

  function onDragStart(x, y) {
    dragStart = [x, y];
  }

  function onDragMove(x, y) {
    var path = svg.createPath(); 
    svg.path(path.move(dragStart[0], dragStart[1]).line(x, y).close(), {stroke: 'red', strokeWidth: 2});
    dragStart = [x, y];
  }

  function drawCircle(x, y) {
    svg.circle(x, y, 5, {fill: 'red'});
  }
});
